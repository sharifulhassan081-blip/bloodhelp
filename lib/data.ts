import type { BloodGroup, BloodRequest, Donor, Gender } from './types';
import { addDays, localDate } from './utils';

export const AREAS = [
  'Zindabazar', 'Amberkhana', 'Bondor Bazar', 'Dargah Gate', 'Subhanighat',
  'Uposhohor', 'Akhalia', 'Shahjalal University', 'Sylhet Sadar', 'Beanibazar',
  'Golapganj', 'Bishwanath', 'Fenchuganj', 'South Surma', 'Tilagor', 'Chowhatta',
];
export const HOSPITALS = [
  'Sylhet MAG Osmani Medical College Hospital',
  'Mount Adora Hospital',
  'Jalalabad Ragib-Rabeya Medical College Hospital',
  'North East Medical College Hospital',
  'Sylhet Women’s Medical College Hospital',
];

// Fictional people and placeholder numbers. Sample numbers are never dialled by the UI.
const names = [
  'Tanvir A.', 'Nusrat J.', 'Arif H.', 'Mahi R.', 'Sabbir C.', 'Tanjina A.',
  'Fahim R.', 'Sumaiya K.', 'Shahriar M.', 'Nabila H.', 'Fardin A.', 'Raisa T.',
  'Rafiul I.', 'Nafisa S.', 'Mahmud H.', 'Sadia A.', 'Raihan C.', 'Anika R.',
  'Foysal A.', 'Jannatul F.', 'Imran H.', 'Moumita D.', 'Sakib R.', 'Farzana I.',
  'Mubin A.', 'Afsana T.', 'Rasel M.', 'Tahmina K.', 'Adnan S.', 'Nabila C.',
  'Nayeem A.', 'Bushra R.', 'Rafi H.', 'Sharmeen A.', 'Zubair M.', 'Nishat J.',
];
const groups: BloodGroup[] = ['O+', 'A+', 'B+', 'AB+', 'O-', 'B-', 'A-', 'AB-'];
const donorAreas = ['Zindabazar', 'Amberkhana', 'Uposhohor', 'Akhalia', 'Sylhet Sadar', 'Subhanighat', 'Dargah Gate', 'Shahjalal University', 'Tilagor', 'South Surma', 'Beanibazar', 'Golapganj', 'Bondor Bazar', 'Chowhatta', 'Bishwanath', 'Fenchuganj'];
export const SAMPLE_DONORS: Donor[] = names.map((name, index) => {
  const status = index % 7 === 5 ? 'unavailable' : index % 6 === 4 ? 'this-week' : 'available';
  return {
    id: `BH-D-DEMO${String(index + 1).padStart(2, '0')}`,
    name,
    bloodGroup: groups[index % groups.length],
    area: donorAreas[index % donorAreas.length],
    gender: (index % 2 === 0 ? 'Male' : 'Female') as Gender,
    distance: Number((0.8 + (index * 0.53) % 13).toFixed(1)),
    lastDonationMonths: status === 'unavailable' ? 2 : 4 + (index % 9),
    donations: 1 + (index * 3) % 16,
    status,
    phone: `${['017', '018', '019'][index % 3]}0000${String(index + 1).padStart(4, '0')}`,
    sample: true,
    verified: false,
  };
});

export function createSampleRequests(now: number): BloodRequest[] {
  const today = localDate(new Date(now));
  const tomorrow = addDays(today, 1);
  const seeds: Omit<BloodRequest, 'createdAt' | 'expiresAt'>[] = [
    { id: 'BH-R-DEMO01', patient: 'R. Ahmed', hospital: HOSPITALS[0], bloodGroup: 'O+', units: 2, unitsReceived: 1, neededBy: today, phone: '', area: 'Sylhet Sadar', note: '', sample: true },
    { id: 'BH-R-DEMO02', patient: 'S. Begum', hospital: HOSPITALS[1], bloodGroup: 'A-', units: 3, unitsReceived: 1, neededBy: today, phone: '', area: 'Akhalia', note: '', sample: true },
    { id: 'BH-R-DEMO03', patient: 'M. Rahman', hospital: HOSPITALS[2], bloodGroup: 'B+', units: 2, unitsReceived: 0, neededBy: tomorrow, phone: '', area: 'Pathantula', note: '', sample: true },
    { id: 'BH-R-DEMO04', patient: 'N. Chowdhury', hospital: HOSPITALS[3], bloodGroup: 'AB-', units: 1, unitsReceived: 0, neededBy: today, phone: '', area: 'South Surma', note: '', sample: true },
  ];
  return seeds.map((seed, index) => {
    const createdAt = now - (index + 1) * 45 * 60 * 1000;
    return { ...seed, createdAt, expiresAt: createdAt + 24 * 60 * 60 * 1000 };
  });
}

export const CAMPS = [
  { id: 'camp-1', day: '21', month: 'NOV', date: '2026-11-21', title: 'A little kindness, a lot of life', place: 'Shahjalal University Campus', area: 'Sylhet Sadar', time: '10:00 AM – 3:00 PM' },
  { id: 'camp-2', day: '28', month: 'NOV', date: '2026-11-28', title: 'Sylhet community blood drive', place: 'Chowhatta Community Centre', area: 'Chowhatta', time: '9:00 AM – 2:00 PM' },
  { id: 'camp-3', day: '05', month: 'DEC', date: '2026-12-05', title: 'Give blood, share hope', place: 'Beanibazar Upazila Health Complex', area: 'Beanibazar', time: '10:00 AM – 1:00 PM' },
];
