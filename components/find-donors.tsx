'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronRight, Heart, MapPin, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { AREAS, SAMPLE_DONORS } from '@/lib/data';
import { BLOOD_GROUPS, type Donor } from '@/lib/types';
import { profileCanBeAvailable, shortName } from '@/lib/utils';
import { useApp } from './app-provider';
import { DonorCard } from './donor-card';
import { Toggle } from './ui';

export function FindDonors() {
  const { tx, profile, loaded } = useApp();
  const params = useSearchParams();
  const [blood, setBlood] = useState(params.get('blood') || '');
  const [area, setArea] = useState(params.get('area') || '');
  const [gender, setGender] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState('nearest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => { setBlood(params.get('blood') || ''); setArea(params.get('area') || ''); }, [params]);
  const donors = useMemo(() => {
    const local: Donor[] = profile ? [{
      id: profile.id, name: shortName(profile.name), bloodGroup: profile.bloodGroup, area: profile.area, gender: profile.gender,
      distance: 0, lastDonationMonths: profile.lastDonationDate ? Math.max(0, Math.floor((Date.now() - new Date(`${profile.lastDonationDate}T00:00:00`).getTime()) / (30.44 * 86400000))) : null,
      donations: profile.history.length, status: profile.available && profileCanBeAvailable(profile) ? 'available' : 'unavailable', phone: profile.phone, sample: false, verified: profile.verified,
    }] : [];
    return [...local, ...SAMPLE_DONORS].filter(donor => (!blood || donor.bloodGroup === blood) && (!area || donor.area === area) && (!gender || donor.gender === gender) && (!availableOnly || donor.status === 'available')).sort((a, b) => sort === 'donations' ? b.donations - a.donations : sort === 'recent' ? (a.lastDonationMonths ?? 999) - (b.lastDonationMonths ?? 999) : a.distance - b.distance);
  }, [profile, blood, area, gender, availableOnly, sort]);
  function clear() { setBlood(''); setArea(''); setGender(''); setAvailableOnly(false); setSort('nearest'); }
  return <><div className="page-hero"><div className="container"><div className="breadcrumb"><Link href="/">{tx('Home', 'হোম')}</Link><ChevronRight size={13} /><span>{tx('Find donors', 'দাতা খুঁজুন')}</span></div><div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-line" /> {tx('FIND A HELPING HAND', 'সাহায্যকারী হাত খুঁজুন')}</div><h1>{tx('Find a blood donor.', 'রক্তদাতা খুঁজুন।')}</h1><p>{tx('Find potential donors in your community, one search at a time.', 'একটি অনুসন্ধানের মাধ্যমে আপনার কমিউনিটিতে সম্ভাব্য দাতা খুঁজুন।')}</p></div><Link href="/request-blood" className="button button-outline"><Heart size={16} /> {tx('Need blood urgently?', 'জরুরি রক্ত প্রয়োজন?')}</Link></div></div></div>
    <section className="section page-section"><div className="container"><div className="notice notice-neutral page-notice"><ShieldDemo /> <span>{tx('These are fictional sample profiles. Calling and messaging sample donors is disabled. Your own registered profile is visible only on this device.', 'এগুলো কাল্পনিক নমুনা প্রোফাইল। নমুনা দাতাদের কল বা মেসেজ করা যাবে না। আপনার নিবন্ধিত প্রোফাইল শুধু এই ডিভাইসে দেখা যাবে।')}</span></div>
      <button className="mobile-filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen}><SlidersHorizontal size={17} /> {tx('Filters', 'ফিল্টার')} <span>{filtersOpen ? '−' : '+'}</span></button>
      <div className="finder-layout"><aside className={`filter-panel card ${filtersOpen ? 'filter-open' : ''}`}><div className="filter-heading"><div><SlidersHorizontal size={18} /><h2>{tx('Filter donors', 'দাতা বাছাই করুন')}</h2></div><button onClick={clear}>{tx('Clear', 'মুছুন')}</button></div><div className="filter-group"><label htmlFor="filter-blood">{tx('Blood group', 'রক্তের গ্রুপ')}</label><select id="filter-blood" value={blood} onChange={e => setBlood(e.target.value)}><option value="">{tx('All blood groups', 'সব রক্তের গ্রুপ')}</option>{BLOOD_GROUPS.map(group => <option key={group}>{group}</option>)}</select></div><div className="filter-group"><label htmlFor="filter-area">{tx('Area / upazila', 'এলাকা / উপজেলা')}</label><select id="filter-area" value={area} onChange={e => setArea(e.target.value)}><option value="">{tx('All areas', 'সব এলাকা')}</option>{AREAS.map(item => <option key={item}>{item}</option>)}</select></div><div className="filter-group"><label htmlFor="filter-gender">{tx('Gender', 'লিঙ্গ')}</label><select id="filter-gender" value={gender} onChange={e => setGender(e.target.value)}><option value="">{tx('Any gender', 'যেকোনো লিঙ্গ')}</option><option value="Male">{tx('Male', 'পুরুষ')}</option><option value="Female">{tx('Female', 'নারী')}</option><option value="Other">{tx('Other', 'অন্যান্য')}</option></select></div><div className="filter-availability"><div><strong>{tx('Available now', 'এখন উপলব্ধ')}</strong><p>{tx('Only show available donors', 'শুধু উপলব্ধ দাতা দেখান')}</p></div><Toggle checked={availableOnly} onChange={setAvailableOnly} label={tx('Show available donors only', 'শুধু উপলব্ধ দাতা দেখান')} /></div><div className="filter-tip"><MapPin size={17} /><p>{tx('Distances are approximate examples from Sylhet city centre, not your location.', 'দূরত্ব আপনার অবস্থান থেকে নয়; সিলেট শহরের কেন্দ্র থেকে আনুমানিক উদাহরণ।')}</p></div></aside>
      <div className="finder-results"><div className="results-heading"><div><h2>{tx('Donors near you', 'আপনার কাছের দাতারা')}</h2><p>{loaded ? `${donors.length} ${tx('profiles found', 'টি প্রোফাইল পাওয়া গেছে')}` : tx('Finding profiles…', 'প্রোফাইল খোঁজা হচ্ছে…')}</p></div><label className="sort-label"><span>{tx('Sort by', 'সাজান')}</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="nearest">{tx('Nearest', 'নিকটতম')}</option><option value="recent">{tx('Most recent donation', 'সাম্প্রতিক রক্তদান')}</option><option value="donations">{tx('Most donations', 'সর্বাধিক রক্তদান')}</option></select></label></div>
        {donors.length ? <div className="finder-grid">{donors.map(donor => <DonorCard key={donor.id} donor={donor} />)}</div> : <div className="empty-state card"><span><Search size={26} /></span><h3>{tx('No donors found', 'কোনো দাতা পাওয়া যায়নি')}</h3><p>{tx('Try another blood group or area, or create an emergency request.', 'অন্য রক্তের গ্রুপ বা এলাকা বেছে নিন, অথবা জরুরি অনুরোধ তৈরি করুন।')}</p><div><button className="button button-subtle" onClick={clear}><RotateCcw size={15} /> {tx('Clear filters', 'ফিল্টার মুছুন')}</button><Link className="button button-primary" href="/request-blood">{tx('Create a request', 'অনুরোধ তৈরি করুন')} <ArrowRight size={16} /></Link></div></div>}
        <p className="disclaimer-line">* {tx('Sample distances and eligibility are illustrative. A clinician must determine actual donation eligibility.', 'নমুনা দূরত্ব ও যোগ্যতা উদাহরণমাত্র। প্রকৃত যোগ্যতা চিকিৎসক নির্ধারণ করবেন।')}</p>
      </div></div></div></section></>;
}
function ShieldDemo() { return <span className="notice-icon"><Heart size={16} /></span>; }
