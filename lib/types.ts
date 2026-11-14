export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];
export type Gender = 'Male' | 'Female' | 'Other';

// The public directory deliberately excludes date of birth, health and history.
export interface Donor {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  area: string;
  gender: Gender;
  phone: string;
  emergency: boolean;
}
export interface Donation { id: string; date: string; location: string; }
export interface DonorProfile extends Donor {
  dateOfBirth: string;
  lastDonationDate: string;
  weight: number;
  diseases: boolean;
  available: boolean;
  history: Donation[];
}
export interface BloodRequest {
  id: string;
  patient: string;
  hospital: string;
  bloodGroup: BloodGroup;
  units: number;
  unitsReceived: number;
  neededBy: string;
  phone: string;
  area: string;
  note: string;
  createdAt: number;
  expiresAt: number;
}
export type NewBloodRequest = Omit<BloodRequest, 'id' | 'createdAt' | 'expiresAt' | 'unitsReceived'>;
export type NewDonorProfile = Omit<DonorProfile, 'id' | 'history'>;
