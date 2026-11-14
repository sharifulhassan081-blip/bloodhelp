import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOOD_GROUPS, type BloodRequest } from '../lib/types';
import { SAMPLE_DONORS, createSampleRequests } from '../lib/data';
import { addDays, addMonths, ageOn, compatibility, countdown, dateEligible, parseSharedRequest, profileCanBeAvailable, relativeNeededBy, requestShareUrl, validPhone } from '../lib/utils';

test('validates Bangladesh phone numbers', () => {
  assert.equal(validPhone('01712345678'), true);
  assert.equal(validPhone('01812345678'), true);
  assert.equal(validPhone('01912345678'), true);
  for (const value of ['+8801712345678', '1712345678', '0171234567', '017123456789', '01ABCDEFGHI']) assert.equal(validPhone(value), false);
});
test('calculates four calendar months with month-end and leap-year clamping', () => {
  assert.equal(addMonths('2024-10-31', 4), '2025-02-28');
  assert.equal(addMonths('2023-10-31', 4), '2024-02-29');
  assert.equal(addMonths('2026-01-15', 4), '2026-05-15');
  assert.equal(dateEligible({ lastDonationDate: '2026-01-15' }, '2026-05-14'), false);
  assert.equal(dateEligible({ lastDonationDate: '2026-01-15' }, '2026-05-15'), true);
  assert.equal(ageOn('2008-11-15', '2026-11-14'), 17);
  assert.equal(ageOn('2008-11-14', '2026-11-14'), 18);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(relativeNeededBy('2026-11-15', '2026-11-14'), 'tomorrow');
  assert.equal(relativeNeededBy('2026-11-15', '2026-11-15'), 'today');
  assert.equal(relativeNeededBy('2026-11-15', '2026-11-16'), '2026-11-15');
});
test('red-cell compatibility is reciprocal and covers all eight types', () => {
  assert.equal(compatibility('O-').give.length, 8);
  assert.deepEqual(compatibility('O-').receive, ['O-']);
  assert.equal(compatibility('AB+').receive.length, 8);
  assert.deepEqual(compatibility('AB+').give, ['AB+']);
  for (const donor of BLOOD_GROUPS) for (const recipient of BLOOD_GROUPS) assert.equal(compatibility(donor).give.includes(recipient), compatibility(recipient).receive.includes(donor));
});
test('share links encode data, validate untrusted input, and expire after 24 hours', () => {
  const request: BloodRequest = { id: 'BH-R-ABCDEF12', patient: 'Test Patient', hospital: 'Osmani', bloodGroup: 'O+', units: 2, unitsReceived: 0, neededBy: 'Today', phone: '01712345678', area: 'Sylhet Sadar', note: '', createdAt: 1000, expiresAt: 1000 + 86400000, sample: false };
  const url = new URL(requestShareUrl(request, 'https://example.com'));
  assert.equal(url.pathname, '/live-requests');
  assert.deepEqual(parseSharedRequest(url.searchParams.get('request')), request);
  assert.equal(parseSharedRequest('{"phone":"javascript:alert(1)"}'), null);
  assert.equal(parseSharedRequest(JSON.stringify({ ...request, phone: 'bad' })), null);
  assert.equal(parseSharedRequest(JSON.stringify({ ...request, units: 5 })), null);
  assert.equal(parseSharedRequest(JSON.stringify({ ...request, expiresAt: request.createdAt + 86400001 })), null);
  assert.equal(countdown(request.expiresAt, request.expiresAt).expired, true);
});
test('sample data is extensive and never masquerades as verified', () => {
  assert.ok(SAMPLE_DONORS.length >= 30);
  assert.ok(SAMPLE_DONORS.every(donor => donor.sample && !donor.verified && validPhone(donor.phone)));
  const now = 200000000;
  assert.ok(createSampleRequests(now).every(request => request.sample && request.expiresAt - request.createdAt === 86400000));
});
test('local availability screen is conservative about health, weight and time', () => {
  const profile = { id:'BH-D-1234', name:'Test Person', phone:'01712345678', bloodGroup:'O+' as const, dateOfBirth:'1990-01-01', gender:'Other' as const, area:'Zindabazar', lastDonationDate:'2026-01-01', weight:60, diseases:false, emergency:true, available:true, verified:false, history:[] };
  assert.equal(profileCanBeAvailable(profile, '2026-05-01'), true);
  assert.equal(profileCanBeAvailable({ ...profile, lastDonationDate: '2026-04-01' }, '2026-05-01'), false);
  assert.equal(profileCanBeAvailable({ ...profile, weight: 49 }, '2026-05-01'), false);
  assert.equal(profileCanBeAvailable({ ...profile, diseases: true }, '2026-05-01'), false);
});
