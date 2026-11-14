import type { BloodRequest, Donor, DonorProfile, Donation, NewBloodRequest, NewDonorProfile } from './types';

// Supabase's snake_case database fields are kept at the storage boundary.
type Row = Record<string, any>; // Results are validated by the database schema.
export function donorFromRow(r: Row): Donor {
  return { id: r.id, name: r.name, phone: r.phone, bloodGroup: r.blood_group, gender: r.gender, area: r.area, emergency: r.emergency };
}
export function donationFromRow(r: Row): Donation { return { id: r.id, date: r.donated_on, location: r.location }; }
export function profileFromRow(r: Row, history: Donation[]): DonorProfile {
  const latest = history.reduce((date, item) => item.date > date ? item.date : date, r.last_donation_date || '');
  return { ...donorFromRow(r), dateOfBirth: r.date_of_birth, lastDonationDate: latest, weight: r.weight, diseases: r.diseases, available: r.available, history };
}
export function profileToRow(p: NewDonorProfile) {
  return { name: p.name, phone: p.phone, blood_group: p.bloodGroup, date_of_birth: p.dateOfBirth, gender: p.gender, area: p.area, last_donation_date: p.lastDonationDate || null, weight: p.weight, diseases: p.diseases, emergency: p.emergency, available: p.available, public_consent: true };
}
export function requestFromRow(r: Row): BloodRequest {
  return { id: r.id, patient: r.patient, hospital: r.hospital, bloodGroup: r.blood_group, units: r.units, unitsReceived: r.units_received, neededBy: r.needed_by, phone: r.phone, area: r.area, note: r.note, createdAt: Date.parse(r.created_at), expiresAt: Date.parse(r.expires_at) };
}
export function requestToRow(r: NewBloodRequest) {
  return { patient: r.patient, hospital: r.hospital, blood_group: r.bloodGroup, units: r.units, needed_by: r.neededBy, phone: r.phone, area: r.area, note: r.note, public_consent: true };
}
