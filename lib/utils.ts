import { BLOOD_GROUPS, type BloodGroup, type BloodRequest, type DonorProfile } from './types';

export function validPhone(phone: string) {
  return /^01\d{9}$/.test(phone.trim());
}

export function makeId(prefix: string) {
  const token = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `BH-${prefix}-${token.toUpperCase()}`;
}

// Add calendar months, clamping the date to the last day of the target month.
export function addMonths(date: string, months: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return '';
  const [year, month, day] = date.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, last));
  return target.toISOString().slice(0, 10);
}

// Use Sylhet's date even when a visitor is in a different time zone.
export function localDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function localToday() {
  return localDate();
}

export function addDays(date: string, days: number) {
  const result = new Date(`${date}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function relativeNeededBy(value: string, today = localToday()) {
  if (value === 'Today' || value === today) return 'today';
  if (value === 'Tomorrow' || value === addDays(today, 1)) return 'tomorrow';
  return value;
}

export function ageOn(date: string, today = localToday()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return -1;
  const [y, m, d] = date.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  return ty - y - (tm < m || (tm === m && td < d) ? 1 : 0);
}

export function nextEligibleDate(profile: Pick<DonorProfile, 'lastDonationDate'>) {
  return profile.lastDonationDate ? addMonths(profile.lastDonationDate, 4) : '';
}

export function dateEligible(profile: Pick<DonorProfile, 'lastDonationDate'>, today = localToday()) {
  const next = nextEligibleDate(profile);
  return !next || next <= today;
}

export function profileCanBeAvailable(profile: Pick<DonorProfile, 'dateOfBirth' | 'weight' | 'diseases' | 'lastDonationDate'>, today = localToday()) {
  return dateEligible(profile, today) && ageOn(profile.dateOfBirth, today) >= 18 && profile.weight >= 50 && !profile.diseases;
}

export function shortName(name: string) {
  const pieces = name.trim().split(/\s+/);
  return pieces.length > 1 ? `${pieces[0]} ${pieces[pieces.length - 1][0].toUpperCase()}.` : pieces[0];
}

export function whatsappPhone(phone: string) {
  return validPhone(phone) ? `88${phone}` : '';
}

// Compatibility is for red-cell transfusions, not plasma or platelets.
const givesTo: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};
export function compatibility(group: BloodGroup) {
  return {
    give: givesTo[group],
    receive: BLOOD_GROUPS.filter(candidate => givesTo[candidate].includes(group)),
  };
}

export function shareMessage(request: BloodRequest) {
  return `URGENT: Need ${request.bloodGroup} blood (${request.units} ${request.units === 1 ? 'bag' : 'bags'}) at ${request.hospital}, Sylhet. Contact: ${request.phone}. Please share!`;
}

// Share only an opaque database ID, never the patient's details in the URL.
export function requestShareUrl(request: Pick<BloodRequest, 'id'>, origin: string) {
  const url = new URL('/live-requests', origin);
  url.searchParams.set('request', request.id);
  return url.toString();
}

export function countdown(expiresAt: number, now: number) {
  const remaining = Math.max(0, expiresAt - now);
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  return { hours, minutes, expired: remaining <= 0 };
}
