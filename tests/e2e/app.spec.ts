import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

type Row = Record<string, any>;

// Browser flows use an isolated in-memory HTTP double. Real Supabase RLS is
// exercised separately in supabase/tests/rls.sql. The double tracks anonymous
// session ownership so a second browser session cannot manage the first one's data.
async function mockBackend(context: BrowserContext) {
  const state: {
    profiles: Row[]; donations: Row[]; requests: Row[]; reports: Row[];
    sessionsCreated: number; failAuth: boolean; failWrites: boolean;
  } = { profiles: [], donations: [], requests: [], reports: [], sessionsCreated: 0, failAuth: false, failWrites: false };
  const sessions = new Map<string, Row>();
  const headers = { 'access-control-allow-origin':'*', 'access-control-allow-headers':'*', 'access-control-allow-methods':'GET,POST,PATCH,DELETE,OPTIONS', 'access-control-expose-headers':'content-range', 'content-type':'application/json' };

  await context.route('**.supabase.co/**', async route => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const method = req.method();
    const reply = (body: unknown, status = 200) => route.fulfill({ status, headers, body: JSON.stringify(body) });
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const token = (req.headers().authorization || '').replace(/^Bearer\s+/i, '');
    const user = sessions.get(token);

    if (path === '/auth/v1/signup' && method === 'POST') {
      if (state.failAuth) return reply({ message: 'Device session unavailable' }, 503);
      const newUser = { id: randomUUID(), is_anonymous: true, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
      const accessToken = `${Buffer.from('{}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: newUser.id, role: 'authenticated', is_anonymous: true, exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url')}.signature`;
      sessions.set(accessToken, newUser); state.sessionsCreated++;
      return reply({ access_token: accessToken, refresh_token: `refresh-${newUser.id}`, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now()/1000)+3600, user: newUser });
    }
    if (path === '/auth/v1/user') return user ? reply(user) : reply({ message: 'No session' }, 401);
    if (path === '/auth/v1/logout') { sessions.delete(token); return reply(null); }
    if (!path.startsWith('/rest/v1/')) return reply({ message:'Unhandled test route' }, 404);

    const table = path.split('/').pop();
    const singular = (req.headers().accept || '').includes('application/vnd.pgrst.object');
    const result = (rows: Row[]) => reply(singular ? rows[0] || null : rows);
    if (table === 'public_donors' && method === 'GET') {
      return reply(state.profiles.filter(p => p.available && !p.diseases && p.weight >= 50 && ['blood_group','area','gender'].every(field => !url.searchParams.get(field) || url.searchParams.get(field) === `eq.${p[field]}`)).map(({ id, name, phone, blood_group, gender, area, emergency }) => ({ id, name, phone, blood_group, gender, area, emergency })));
    }
    if (table === 'public_requests' && method === 'GET') {
      return reply(state.requests.filter(r => new Date(r.expires_at).getTime() > Date.now() && r.units_received < r.units && ['id','blood_group','hospital'].every(field => !url.searchParams.get(field) || url.searchParams.get(field) === `eq.${r[field]}`)).map(({ owner_id, public_consent, ...r }) => r));
    }
    if (!user) return reply({ message: 'Private records require a device session' }, 401);
    if (method !== 'GET' && state.failWrites) return reply({ message:'Simulated database failure', code:'XX000' }, 400);
    const payload = req.postDataJSON() as Row | null;
    const own = (row: Row) => row.owner_id === user.id;
    const id = (url.searchParams.get('id') || '').replace(/^eq\./, '');

    if (path === '/rest/v1/rpc/delete_my_account' && method === 'POST') {
      const donorIds = state.profiles.filter(own).map(p => p.id);
      state.profiles = state.profiles.filter(p => !own(p));
      state.donations = state.donations.filter(d => !own(d));
      state.requests = state.requests.filter(r => !own(r));
      state.reports = state.reports.filter(r => !own(r) && !donorIds.includes(r.donor_id));
      return reply(null);
    }
    if (table === 'donor_profiles') {
      if (method === 'GET') return reply(state.profiles.filter(own));
      if (method === 'POST') {
        if (state.profiles.some(own)) return reply({ message:'Duplicate profile' }, 409);
        const row = { ...payload, id:randomUUID(), owner_id:user.id, created_at:new Date().toISOString() };
        state.profiles.push(row); return result([row]);
      }
      const row = state.profiles.find(p => own(p) && p.id === id);
      if (method === 'PATCH' && row) { Object.assign(row, payload); return result([row]); }
      if (method === 'DELETE' && row) {
        state.profiles = state.profiles.filter(p => p !== row);
        state.donations = state.donations.filter(d => !own(d));
        state.reports = state.reports.filter(r => r.donor_id !== row.id);
        return reply([{ id }]);
      }
    }
    if (table === 'donor_reports') {
      if (method === 'GET') return reply(state.reports.filter(own));
      if (method === 'POST') { state.reports.push({ ...payload, id:randomUUID(), owner_id:user.id }); return reply(null, 201); }
    }
    if (table === 'donations') {
      if (method === 'GET') return reply(state.donations.filter(own));
      if (method === 'POST') {
        state.donations.push({ ...payload, id:randomUUID(), owner_id:user.id });
        const profile = state.profiles.find(own);
        if (profile) { profile.available = false; profile.last_donation_date = payload?.donated_on; }
        return reply(null, 201);
      }
    }
    if (table === 'blood_requests') {
      if (method === 'GET') return reply(state.requests.filter(own));
      if (method === 'POST') {
        const now = Date.now();
        const row = { ...payload, id:randomUUID(), owner_id:user.id, units_received:0, created_at:new Date(now).toISOString(), expires_at:new Date(now+86400000).toISOString() };
        state.requests.unshift(row); return result([row]);
      }
      const row = state.requests.find(r => own(r) && r.id === id);
      if (method === 'PATCH' && row) { Object.assign(row, payload); return result([row]); }
      if (method === 'DELETE' && row) { state.requests = state.requests.filter(r => r !== row); return reply([{ id }]); }
    }
    return reply({ message:`Unhandled ${method} ${path}` }, 404);
  });
  return state;
}

async function fillRequest(page: Page) {
  await page.getByLabel('Patient name').first().fill('Test Patient');
  await page.getByLabel('Hospital name').selectOption({ label:'Mount Adora Hospital' });
  await page.getByLabel('Blood group needed').selectOption('O+');
  await page.getByLabel('Units needed').selectOption('2');
  await page.getByLabel('Contact number').first().fill('01712345678');
  await page.getByLabel('Area / upazila').selectOption('Akhalia');
  await page.getByLabel(/I have permission to publish/).check();
}
async function fillDonor(page: Page) {
  await page.getByLabel('Full name').first().fill('Test Donor');
  await page.getByLabel('Phone number').first().fill('01812345678');
  await page.getByLabel('Blood group').first().selectOption('B+');
  await page.getByLabel('Date of birth').fill('1990-05-10');
  await page.getByLabel('Gender').first().selectOption('Other');
  await page.getByLabel('Area / upazila').selectOption('Zindabazar');
  await page.getByLabel('Weight (kg)').fill('60');
  await page.getByLabel('Any diseases or health conditions?').selectOption('no');
  await page.getByLabel(/I consent to publicly sharing/).check();
}
async function saveBrowserStorage(page: Page) {
  return page.evaluate(() => Object.entries(localStorage));
}
async function restoreBrowserStorage(page: Page, entries: string[][]) {
  await page.evaluate(values => { localStorage.clear(); for (const [key, value] of values) localStorage.setItem(key, value); }, entries);
}

test('public browsing and both forms need no account or session', async ({ page, context }) => {
  const state = await mockBackend(context);
  await page.goto('/');
  await expect(page.getByText('No active requests yet.')).toBeVisible();
  await expect(page.getByText('No available donors have registered yet.')).toBeVisible();
  await expect(page.getByText('DEMO MODE')).toHaveCount(0);
  await expect(page.getByRole('link', { name:/sign in|sign up|account/i })).toHaveCount(0);
  await page.getByRole('button', { name:'বাংলা', exact:true }).click();
  await expect(page.locator('h1')).toContainText('সিলেটে');
  await page.getByRole('button', { name:'EN', exact:true }).click();
  await page.getByRole('button', { name:'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByLabel('Select blood group', { exact:true }).selectOption('A+');
  await page.getByLabel('Select area', { exact:true }).selectOption('Amberkhana');
  await page.getByRole('button', { name:'Search donors' }).click();
  await expect(page.getByText('No donors found')).toBeVisible();
  await page.goto('/request-blood');
  await expect(page.getByLabel('Patient name').first()).toBeVisible();
  await expect(page.getByText('No account is needed.')).toBeVisible();
  await page.goto('/register');
  await expect(page.getByLabel('Full name').first()).toBeVisible();
  await expect(page.getByText('No account is needed.')).toBeVisible();
  await page.goto('/dashboard');
  await expect(page.getByText('Your dashboard.')).toBeVisible();
  await page.goto('/account');
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(state.sessionsCreated).toBe(0);
});

test('a request can be posted without login, managed on the same browser, and deleted', async ({ page, context }) => {
  const state = await mockBackend(context);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/request-blood'); await fillRequest(page);
  await page.getByRole('button', { name:'Create request' }).click();
  await expect(page.getByText('Your request is ready to share.')).toBeVisible();
  expect(state.sessionsCreated).toBe(1); expect(state.requests).toHaveLength(1); expect(state.requests[0].public_consent).toBe(true);
  await page.getByRole('button', { name:'Copy link' }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(new URL(link).searchParams.get('request')).toBe(state.requests[0].id);
  expect(link).not.toContain('01712345678'); expect(link).not.toContain('Patient');
  const ownerStorage = await saveBrowserStorage(page);
  await page.goto(link); await expect(page.locator('article.request-card')).toHaveCount(1);
  await page.getByRole('button', { name:'I can donate' }).click();
  await expect(page.getByRole('link', { name:/Call 01712345678/ })).toBeVisible();
  await expect(page.getByRole('button', { name:'Mark one unit received' })).toBeVisible();
  await page.getByRole('button', { name:'Close', exact:true }).click();
  await page.evaluate(() => localStorage.clear());
  await page.goto(link); await page.getByRole('button', { name:'I can donate' }).click();
  await expect(page.getByRole('button', { name:'Mark one unit received' })).toHaveCount(0);
  await restoreBrowserStorage(page, ownerStorage); await page.goto('/dashboard');
  await page.getByRole('button', { name:'+1 received' }).click();
  await expect.poll(() => state.requests[0].units_received).toBe(1);
  await expect(page.getByText('1 / 2 units received')).toBeVisible();
  await page.getByRole('button', { name:'+1 received' }).click();
  await expect(page.getByText('Fulfilled')).toBeVisible();
  await page.goto('/live-requests'); await expect(page.getByText('No active requests found')).toBeVisible();
  await page.goto('/dashboard'); await page.getByRole('button', { name:'Delete', exact:true }).click();
  await page.getByRole('button', { name:'Delete request', exact:true }).click();
  await expect.poll(() => state.requests.length).toBe(0);
  await page.getByRole('button', { name:'Delete all my data' }).click();
  await page.getByRole('button', { name:'Delete all data', exact:true }).click();
  await expect(page.getByText('Your records were deleted.')).toBeVisible();
});

test('donor registration and reports work without login and stay owner-isolated', async ({ page, context }) => {
  const state = await mockBackend(context);
  await page.goto('/register'); await fillDonor(page);
  await page.getByRole('button', { name:'Create donor card' }).click();
  await expect(page.getByText('Donor ID card')).toBeVisible();
  expect(state.sessionsCreated).toBe(1); expect(state.profiles[0].public_consent).toBe(true);
  const ownerStorage = await saveBrowserStorage(page);
  await page.evaluate(() => localStorage.clear());
  await page.goto('/find-donors'); await expect(page.getByText('Test Donor')).toBeVisible();
  await expect(page.getByRole('link', { name:'Call', exact:true })).toHaveAttribute('href', 'tel:01812345678');
  await page.getByRole('button', { name:'Profile' }).click(); await page.getByRole('button', { name:'Report a concern' }).click();
  await page.getByLabel('What is the concern?').fill('The phone number is incorrect.');
  await page.getByRole('button', { name:'Submit report' }).click();
  await expect(page.getByText('Report saved.', { exact:false })).toBeVisible();
  expect(state.sessionsCreated).toBe(2); expect(state.reports).toHaveLength(1);
  await page.goto('/dashboard'); await expect(page.getByText('Test Donor')).toHaveCount(0);
  await expect(page.getByRole('link', { name:'Create donor profile' })).toBeVisible();
  await restoreBrowserStorage(page, ownerStorage); await page.goto('/dashboard');
  await expect(page.getByText('Test Donor')).toBeVisible();
  await page.getByRole('switch', { name:'I am available to donate now' }).click();
  await expect.poll(() => state.profiles[0]?.available).toBe(false);
  await page.reload(); await expect(page.locator('.availability-card')).toContainText('Not available right now');
  await page.getByRole('button', { name:'Add donation' }).click();
  await page.getByLabel('Donation date').fill(new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Dhaka', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date()));
  await page.getByLabel('Hospital or location').fill('Test Hospital');
  await page.getByRole('button', { name:'Save donation' }).click();
  await expect(page.getByText('Test Hospital')).toBeVisible(); expect(state.donations).toHaveLength(1);
  await expect(page.getByRole('switch', { name:'I am available to donate now' })).toBeDisabled();
  await page.getByRole('button', { name:'Delete donor profile' }).click();
  await page.getByRole('button', { name:'Delete profile', exact:true }).click();
  await expect.poll(() => state.profiles.length).toBe(0); expect(state.donations).toHaveLength(0); expect(state.reports).toHaveLength(0);
});

test('session creation or database failures never produce a success screen', async ({ page, context }) => {
  const state = await mockBackend(context);
  await page.goto('/request-blood'); await fillRequest(page);
  state.failAuth = true; await page.getByRole('button', { name:'Create request' }).click();
  await expect(page.locator('p[role="alert"]')).toContainText('Could not publish');
  expect(state.sessionsCreated).toBe(0); expect(state.requests).toHaveLength(0);
  state.failAuth = false; state.failWrites = true;
  await page.getByRole('button', { name:'Create request' }).click();
  await expect(page.locator('p[role="alert"]')).toContainText('Could not publish');
  expect(state.sessionsCreated).toBe(1); expect(state.requests).toHaveLength(0);
  state.failWrites = false; await page.getByRole('button', { name:'Create request' }).click();
  await expect(page.getByText('Your request is ready to share.')).toBeVisible();
  expect(state.sessionsCreated).toBe(1); expect(state.requests).toHaveLength(1);
});

test('all pages fit narrow screens in English and Bangla without a session', async ({ page, context }) => {
  await mockBackend(context); await page.goto('/resources');
  await page.getByLabel('Your blood group').selectOption('O-');
  await expect(page.locator('.compatibility-results > div').first().locator('.blood-chips span')).toHaveCount(8);
  await page.setViewportSize({ width:320, height:800 });
  const routes = ['/', '/find-donors', '/live-requests', '/request-blood', '/register', '/dashboard', '/resources', '/account'];
  for (const language of ['en', 'bn']) {
    await page.goto('/'); if (language === 'bn') await page.getByRole('button', { name:'বাংলা', exact:true }).click();
    for (const route of routes) { await page.goto(route); await page.waitForLoadState('networkidle'); expect(await page.evaluate(() => document.documentElement.scrollWidth), `${language}: ${route}`).toBe(320); }
  }
});

test('device-owned forms and dashboard fit 320px in both languages', async ({ page, context }) => {
  await mockBackend(context); await page.setViewportSize({ width:320, height:800 });
  await page.goto('/register'); await fillDonor(page);
  await page.getByRole('button', { name:'Create donor card' }).click();
  await expect(page.getByText('Donor ID card')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  for (const route of ['/dashboard', '/request-blood', '/register?edit=1', '/account']) {
    await page.goto(route); await page.waitForLoadState('networkidle'); expect(await page.evaluate(() => document.documentElement.scrollWidth), `en: ${route}`).toBe(320);
  }
  await page.getByRole('button', { name:'বাংলা', exact:true }).click();
  for (const route of ['/dashboard', '/request-blood', '/register?edit=1', '/account']) {
    await page.goto(route); await page.waitForLoadState('networkidle'); expect(await page.evaluate(() => document.documentElement.scrollWidth), `bn: ${route}`).toBe(320);
  }
});
