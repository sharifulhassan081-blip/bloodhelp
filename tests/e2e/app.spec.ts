import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

type Row = Record<string, any>;
// Browser tests use an isolated in-memory HTTP double. The real database's
// RLS and constraints are tested separately against Supabase in a rollback transaction.
async function mockBackend(context: BrowserContext) {
  const state: { profile: Row | null; donations: Row[]; requests: Row[]; reports: Row[]; failWrites: boolean; signedIn: boolean } = { profile: null, donations: [], requests: [], reports: [], failWrites: false, signedIn: false };
  const user = { id: randomUUID(), email: 'test@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
  const token = `${Buffer.from('{}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: user.id, role: 'authenticated', exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url')}.signature`;
  const headers = { 'access-control-allow-origin':'*', 'access-control-allow-headers':'*', 'access-control-allow-methods':'GET,POST,PATCH,DELETE,OPTIONS', 'access-control-expose-headers':'content-range', 'content-type':'application/json' };
  await context.route('**.supabase.co/**', async route => {
    const req = route.request(); const url = new URL(req.url()); const path = url.pathname; const method = req.method();
    const reply = (body: unknown, status = 200) => route.fulfill({ status, headers, body: JSON.stringify(body) });
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (path === '/auth/v1/token') { state.signedIn = true; return reply({ access_token: token, refresh_token:'refresh-token', token_type:'bearer', expires_in:3600, expires_at:Math.floor(Date.now()/1000)+3600, user }); }
    if (path === '/auth/v1/user') return reply(user);
    if (path === '/auth/v1/logout') { state.signedIn = false; return reply({}); }
    if (path === '/auth/v1/signup') return reply({ user, session: null });
    if (path === '/auth/v1/recover') return reply({});
    if (!path.startsWith('/rest/v1/')) return reply({ message:'Unhandled test route' }, 404);
    if (path === '/rest/v1/rpc/delete_my_account' && method === 'POST') { state.profile = null; state.donations = []; state.requests = []; state.signedIn = false; return reply(null); }
    const table = path.split('/').pop();
    if (method !== 'GET' && state.failWrites) return reply({ message:'Simulated database failure', code:'XX000' }, 400);
    const payload = req.postDataJSON() as Row | null;
    const singular = (req.headers().accept || '').includes('application/vnd.pgrst.object');
    const result = (rows: Row[]) => reply(singular ? rows[0] || null : rows);
    if (table === 'public_donors' && method === 'GET') {
      const p = state.profile;
      return reply(p?.available && !p.diseases && p.weight >= 50 && ['blood_group','area','gender'].every(field => !url.searchParams.get(field) || url.searchParams.get(field) === `eq.${p[field]}`) ? [{ id:p.id, name:p.name, phone:p.phone, blood_group:p.blood_group, gender:p.gender, area:p.area, emergency:p.emergency }] : []);
    }
    if (table === 'public_requests' && method === 'GET') return reply(state.requests.filter(r => new Date(r.expires_at).getTime() > Date.now() && r.units_received < r.units && ['id','blood_group','hospital'].every(field => !url.searchParams.get(field) || url.searchParams.get(field) === `eq.${r[field]}`)).map(({ owner_id, public_consent, ...r }) => r));
    if (table === 'donor_profiles') {
      if (method === 'GET') return reply(state.profile ? [state.profile] : []);
      if (method === 'POST') { state.profile = { ...payload, id:randomUUID(), owner_id:user.id, created_at:new Date().toISOString() }; return result([state.profile]); }
      if (method === 'PATCH' && state.profile) { state.profile = { ...state.profile, ...payload }; return result([state.profile]); }
      if (method === 'DELETE' && state.profile) { const id = state.profile.id; state.profile = null; state.donations = []; return reply([{id}]); }
    }
    if (table === 'donor_reports' && method === 'POST') { state.reports.push({ ...payload, owner_id:user.id }); return reply(null, 201); }
    if (table === 'donations') {
      if (method === 'GET') return reply(state.donations);
      if (method === 'POST') { state.donations.push({ ...payload, id:randomUUID(), owner_id:user.id }); if (state.profile) { state.profile.available = false; state.profile.last_donation_date = payload?.donated_on; } return reply(null, 201); }
    }
    if (table === 'blood_requests') {
      if (method === 'GET') return reply(state.requests);
      if (method === 'POST') { const now = Date.now(); const row = { ...payload, id:randomUUID(), owner_id:user.id, units_received:0, created_at:new Date(now).toISOString(), expires_at:new Date(now+86400000).toISOString() }; state.requests.unshift(row); return result([row]); }
      const id = (url.searchParams.get('id') || '').replace(/^eq\./, ''); const row = state.requests.find(r => r.id === id);
      if (method === 'PATCH' && row) { Object.assign(row, payload); return result([row]); }
      if (method === 'DELETE' && row) { state.requests = state.requests.filter(r => r.id !== id); return reply([{id}]); }
    }
    return reply({ message:`Unhandled ${method} ${path}` }, 404);
  });
  return state;
}
async function signIn(page: Page, next = '/dashboard') {
  await page.goto(`/account?next=${encodeURIComponent(next)}`);
  await page.getByLabel('Email address').fill('test@example.invalid');
  await page.getByLabel('Password', { exact:true }).fill('test-password');
  await page.getByRole('button', { name:'Sign in', exact:true }).click();
  await page.waitForURL(`**${next}`);
}

test('empty live feeds, sign-in gate, language, theme and search', async ({ page, context }) => {
  await mockBackend(context); await page.goto('/');
  await expect(page.getByText('No active requests yet.')).toBeVisible();
  await expect(page.getByText('No available donors have registered yet.')).toBeVisible();
  await expect(page.getByText('DEMO MODE')).toHaveCount(0);
  await page.getByRole('button', { name:'বাংলা', exact:true }).click(); await expect(page.locator('h1')).toContainText('সিলেটে');
  await page.getByRole('button', { name:'EN', exact:true }).click(); await page.getByRole('button', { name:'Switch to dark mode' }).click(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByLabel('Select blood group', { exact:true }).selectOption('A+'); await page.getByLabel('Select area', { exact:true }).selectOption('Amberkhana'); await page.getByRole('button', { name:'Search donors' }).click();
  await expect(page.getByText('No donors found')).toBeVisible(); await page.goto('/request-blood'); await expect(page.getByText('Sign in to continue.')).toBeVisible();
});

test('request is published, share URL contains only id, owner can fulfill it', async ({ page, context }) => {
  const state = await mockBackend(context); await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await signIn(page, '/request-blood');
  await page.getByLabel('Patient name').first().fill('Test Patient'); await page.getByLabel('Hospital name').selectOption({ label:'Mount Adora Hospital' });
  await page.getByLabel('Blood group needed').selectOption('O+'); await page.getByLabel('Units needed').selectOption('2');
  await page.getByLabel('Contact number').first().fill('01712345678'); await page.getByLabel('Area / upazila').selectOption('Akhalia');
  await page.getByLabel(/I have permission to publish/).check(); await page.getByRole('button', { name:'Create request' }).click();
  await expect(page.getByText('Your request is ready to share.')).toBeVisible(); expect(state.requests).toHaveLength(1); expect(state.requests[0].public_consent).toBe(true);
  await page.getByRole('button', { name:'Copy link' }).click(); const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(new URL(link).searchParams.get('request')).toBe(state.requests[0].id); expect(link).not.toContain('01712345678'); expect(link).not.toContain('Patient');
  await page.goto(link); await expect(page.locator('article.request-card')).toHaveCount(1); await page.getByRole('button', { name:'I can donate' }).click();
  await expect(page.getByRole('link', { name:/Call 01712345678/ })).toBeVisible(); await page.getByRole('button', { name:'Close', exact:true }).click();
  await page.goto('/account'); await page.getByRole('button', { name:'Sign out' }).click();
  await page.goto(link); await expect(page.locator('article.request-card')).toHaveCount(1);
  await page.getByRole('button', { name:'I can donate' }).click(); await expect(page.getByRole('link', { name:/Call 01712345678/ })).toBeVisible();
  await expect(page.getByRole('button', { name:'Mark one unit received' })).toHaveCount(0);
  await signIn(page); await page.getByRole('button', { name:'+1 received' }).click(); await expect.poll(() => state.requests[0].units_received).toBe(1);
  await expect(page.getByText('1 / 2 units received')).toBeVisible(); await page.getByRole('button', { name:'+1 received' }).click(); await expect(page.getByText('Fulfilled')).toBeVisible();
  await page.goto('/live-requests'); await expect(page.getByText('No active requests found')).toBeVisible();
  await page.goto('/dashboard'); await page.getByRole('button', { name:'Delete', exact:true }).click(); await page.getByRole('button', { name:'Delete request', exact:true }).click();
  await expect.poll(() => state.requests.length).toBe(0);
  await page.goto('/account'); await page.getByRole('button', { name:'Delete my account' }).click(); await page.getByRole('button', { name:'Delete account', exact:true }).click();
  await expect(page).toHaveURL(/\/$/); expect(state.signedIn).toBe(false);
});

test('donor registration, availability and donation history use shared storage', async ({ page, context }) => {
  const state = await mockBackend(context); await signIn(page, '/register');
  await page.getByLabel('Full name').first().fill('Test Donor'); await page.getByLabel('Phone number').first().fill('01812345678');
  await page.getByLabel('Blood group').first().selectOption('B+'); await page.getByLabel('Date of birth').fill('1990-05-10');
  await page.getByLabel('Gender').first().selectOption('Other'); await page.getByLabel('Area / upazila').selectOption('Zindabazar');
  await page.getByLabel('Weight (kg)').fill('60'); await page.getByLabel('Any diseases or health conditions?').selectOption('no');
  await page.getByLabel(/I consent to publicly sharing/).check(); await page.getByRole('button', { name:'Create donor card' }).click();
  await expect(page.getByText('Donor ID card')).toBeVisible(); expect(state.profile?.public_consent).toBe(true);
  await page.goto('/find-donors'); await expect(page.getByText('Test Donor')).toBeVisible(); await expect(page.getByRole('link', {name:'Call', exact:true})).toHaveAttribute('href', 'tel:01812345678');
  await page.getByRole('button', {name:'Profile'}).click(); await page.getByRole('button', {name:'Report a concern'}).click();
  await page.getByLabel('What is the concern?').fill('The phone number is incorrect.'); await page.getByRole('button', {name:'Submit report'}).click();
  await expect(page.getByText('Report saved.', {exact:false})).toBeVisible(); expect(state.reports).toHaveLength(1); await page.getByRole('button', {name:'Close', exact:true}).click();
  await page.goto('/dashboard'); await page.getByRole('switch', { name:'I am available to donate now' }).click(); await expect.poll(() => state.profile?.available).toBe(false);
  await page.reload(); await expect(page.locator('.availability-card')).toContainText('Not available right now');
  await page.getByRole('button', { name:'Add donation' }).click(); await page.getByLabel('Donation date').fill(new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Dhaka', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date()));
  await page.getByLabel('Hospital or location').fill('Test Hospital'); await page.getByRole('button', { name:'Save donation' }).click();
  await expect(page.getByText('Test Hospital')).toBeVisible(); expect(state.donations).toHaveLength(1);
  await expect(page.getByRole('switch', { name:'I am available to donate now' })).toBeDisabled();
  await page.getByRole('button', { name:'Delete donor profile' }).click(); await page.getByRole('button', { name:'Delete profile', exact:true }).click();
  await expect.poll(() => state.profile).toBeNull(); expect(state.donations).toHaveLength(0);
});

test('failed writes do not produce a success screen', async ({ page, context }) => {
  const state = await mockBackend(context); await signIn(page, '/request-blood'); state.failWrites = true;
  await page.getByLabel('Patient name').first().fill('Test Patient'); await page.getByLabel('Hospital name').selectOption({label:'Mount Adora Hospital'}); await page.getByLabel('Blood group needed').selectOption('O+');
  await page.getByLabel('Contact number').first().fill('01712345678'); await page.getByLabel('Area / upazila').selectOption('Akhalia'); await page.getByLabel(/I have permission to publish/).check();
  await page.getByRole('button', {name:'Create request'}).click(); await expect(page.locator('p[role="alert"]')).toContainText('Could not publish'); expect(state.requests).toHaveLength(0);
});

test('compatibility and all pages fit narrow screens in English and Bangla', async ({ page, context }) => {
  await mockBackend(context); await page.goto('/resources'); await page.getByLabel('Your blood group').selectOption('O-');
  await expect(page.locator('.compatibility-results > div').first().locator('.blood-chips span')).toHaveCount(8);
  await page.setViewportSize({ width:320, height:800 });
  const routes = ['/', '/find-donors', '/live-requests', '/request-blood', '/register', '/dashboard', '/resources', '/account'];
  for (const language of ['en', 'bn']) { await page.goto('/'); if (language === 'bn') await page.getByRole('button', {name:'বাংলা', exact:true}).click();
    for (const route of routes) { await page.goto(route); await page.waitForLoadState('networkidle'); expect(await page.evaluate(() => document.documentElement.scrollWidth), `${language}: ${route}`).toBe(320); }
  }
});

test('authenticated forms and dashboard fit 320px in both languages', async ({ page, context }) => {
  await mockBackend(context); await page.setViewportSize({ width:320, height:800 }); await signIn(page, '/register');
  await expect(page.getByLabel('Full name').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await page.getByLabel('Full name').first().fill('Test Donor'); await page.getByLabel('Phone number').first().fill('01812345678');
  await page.getByLabel('Blood group').first().selectOption('B+'); await page.getByLabel('Date of birth').fill('1990-05-10');
  await page.getByLabel('Gender').first().selectOption('Other'); await page.getByLabel('Area / upazila').selectOption('Zindabazar');
  await page.getByLabel('Weight (kg)').fill('60'); await page.getByLabel('Any diseases or health conditions?').selectOption('no');
  await page.getByLabel(/I consent to publicly sharing/).check(); await page.getByRole('button', { name:'Create donor card' }).click();
  await expect(page.getByText('Donor ID card')).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  for (const route of ['/dashboard', '/request-blood', '/register?edit=1', '/account']) {
    await page.goto(route); await page.waitForLoadState('networkidle'); expect(await page.evaluate(() => document.documentElement.scrollWidth), `en: ${route}`).toBe(320);
  }
  await page.getByRole('button', { name:'বাংলা', exact:true }).click();
  for (const route of ['/dashboard', '/request-blood', '/register?edit=1', '/account']) {
    await page.goto(route); await page.waitForLoadState('networkidle'); expect(await page.evaluate(() => document.documentElement.scrollWidth), `bn: ${route}`).toBe(320);
  }
});
