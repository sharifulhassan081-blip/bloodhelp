import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOOD_GROUPS, type BloodRequest } from '../lib/types';
import { addDays, addMonths, ageOn, compatibility, countdown, dateEligible, localDate, profileCanBeAvailable, relativeNeededBy, requestShareUrl, validPhone } from '../lib/utils';
import { donorFromRow, profileFromRow, requestFromRow, requestToRow } from '../lib/mappers';

test('validates Bangladesh phone numbers', () => {
  assert.equal(validPhone('01712345678'), true); assert.equal(validPhone('01812345678'), true); assert.equal(validPhone('01912345678'), true);
  for (const value of ['+8801712345678', '1712345678', '0171234567', '017123456789', '01ABCDEFGHI']) assert.equal(validPhone(value), false);
});
test('calculates four calendar months with month-end and leap-year clamping', () => {
  assert.equal(addMonths('2024-10-31', 4), '2025-02-28'); assert.equal(addMonths('2023-10-31', 4), '2024-02-29');
  assert.equal(dateEligible({ lastDonationDate: '2026-01-15' }, '2026-05-14'), false); assert.equal(dateEligible({ lastDonationDate: '2026-01-15' }, '2026-05-15'), true);
  assert.equal(ageOn('2008-11-15', '2026-11-14'), 17); assert.equal(ageOn('2008-11-14', '2026-11-14'), 18);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01'); assert.equal(relativeNeededBy('2026-11-15', '2026-11-14'), 'tomorrow');
  assert.equal(localDate(new Date('2026-11-14T20:00:00Z')), '2026-11-15');
});
test('red-cell compatibility is reciprocal and covers all eight types', () => {
  assert.equal(compatibility('O-').give.length, 8); assert.deepEqual(compatibility('O-').receive, ['O-']);
  assert.equal(compatibility('AB+').receive.length, 8); assert.deepEqual(compatibility('AB+').give, ['AB+']);
  for (const donor of BLOOD_GROUPS) for (const recipient of BLOOD_GROUPS) assert.equal(compatibility(donor).give.includes(recipient), compatibility(recipient).receive.includes(donor));
});
test('request share link contains only the opaque id, not medical or contact details', () => {
  const request: BloodRequest = { id: '919502ec-8b28-495b-9867-ff7aecc2403f', patient: 'Test Patient', hospital: 'Test Hospital', bloodGroup: 'O+', units: 2, unitsReceived: 0, neededBy: '2026-11-14', phone: '01712345678', area: 'Sylhet Sadar', note: 'Private example', createdAt: 1000, expiresAt: 1000 + 86400000 };
  const url = new URL(requestShareUrl(request, 'https://example.com'));
  assert.equal(url.pathname, '/live-requests'); assert.equal(url.searchParams.get('request'), request.id);
  assert.equal([...url.searchParams].length, 1); assert.ok(!url.toString().includes(request.phone)); assert.ok(!url.toString().includes('Patient'));
  assert.equal(countdown(request.expiresAt, request.expiresAt).expired, true);
});
test('availability screen is conservative about health, weight and time', () => {
  const profile = { dateOfBirth:'1990-01-01', lastDonationDate:'2026-01-01', weight:60, diseases:false };
  assert.equal(profileCanBeAvailable(profile, '2026-05-01'), true); assert.equal(profileCanBeAvailable({ ...profile, lastDonationDate: '2026-04-01' }, '2026-05-01'), false);
  assert.equal(profileCanBeAvailable({ ...profile, weight: 49 }, '2026-05-01'), false); assert.equal(profileCanBeAvailable({ ...profile, diseases: true }, '2026-05-01'), false);
});
test('storage mappers separate public and private data and enforce consent writes', () => {
  const row = { id:'id', name:'Test Donor', phone:'01712345678', blood_group:'O+', gender:'Other', area:'Zindabazar', date_of_birth:'1990-01-01', last_donation_date:'2025-01-01', weight:60, diseases:false, emergency:true, available:true };
  assert.deepEqual(Object.keys(donorFromRow(row)).sort(), ['area','bloodGroup','emergency','gender','id','name','phone']);
  assert.equal(profileFromRow(row, [{id:'h',date:'2026-01-01',location:'Hospital'}]).lastDonationDate, '2026-01-01');
  const input = { patient:'Patient',hospital:'Hospital',bloodGroup:'O+' as const,units:1,neededBy:'2026-11-14',phone:'01712345678',area:'Zindabazar',note:'' };
  const stored = requestToRow(input); assert.equal(stored.public_consent, true); assert.ok(!('owner_id' in stored)); assert.ok(!('expires_at' in stored));
  const request = requestFromRow({ ...stored, id:'id', units_received:0, created_at:'2026-11-14T00:00:00Z', expires_at:'2026-11-15T00:00:00Z' });
  assert.equal(request.expiresAt - request.createdAt, 86400000);
});
