export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];
export type Gender = 'Male' | 'Female' | 'Other';
export type DonorStatus = 'available' | 'this-week' | 'unavailable';

export interface Donor {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  area: string;
  gender: Gender;
  distance: number;
  lastDonationMonths: number | null;
  donations: number;
  status: DonorStatus;
  phone: string;
  sample: boolean;
  verified: boolean;
}

export interface Donation {
  id: string;
  date: string;
  location: string;
}

export interface DonorProfile {
  id: string;
  name: string;
  phone: string;
  bloodGroup: BloodGroup;
  dateOfBirth: string;
  gender: Gender;
  area: string;
  lastDonationDate: string;
  weight: number;
  diseases: boolean;
  emergency: boolean;
  available: boolean;
  verified: boolean;
  history: Donation[];
  photo?: string;
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
  sample: boolean;
}
