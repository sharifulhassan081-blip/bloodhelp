'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, ChevronRight, Heart, MapPin, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { AREAS } from '@/lib/data';
import { BLOOD_GROUPS, type Donor } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { donorFromRow } from '@/lib/mappers';
import { useApp } from './app-provider';
import { DonorCard } from './donor-card';

export function FindDonors() {
  const { tx } = useApp();
  const params = useSearchParams();
  const [blood, setBlood] = useState(params.get('blood') || '');
  const [area, setArea] = useState(params.get('area') || '');
  const [gender, setGender] = useState(''); const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(0); const [version, setVersion] = useState(0);
  const [donors, setDonors] = useState<Donor[]>([]); const [donorsLoading, setDonorsLoading] = useState(true); const [donorError, setDonorError] = useState('');
  useEffect(() => { setBlood(params.get('blood') || ''); setArea(params.get('area') || ''); setPage(0); }, [params]);
  useEffect(() => {
    let active = true;
    async function search() {
      setDonorsLoading(true); setDonorError('');
      if (!supabase) { if (active) { setDonorError('unavailable'); setDonorsLoading(false); } return; }
      let query = supabase.from('public_donors').select('*').order('name').order('id').range(page * 24, page * 24 + 23);
      if (blood) query = query.eq('blood_group', blood);
      if (area) query = query.eq('area', area);
      if (gender) query = query.eq('gender', gender);
      try {
        const { data, error } = await query;
        if (!active) return;
        if (error) { setDonors([]); setDonorError('unavailable'); }
        else setDonors((data || []).map(donorFromRow));
      } catch { if (active) { setDonors([]); setDonorError('unavailable'); } }
      finally { if (active) setDonorsLoading(false); }
    }
    void search(); return () => { active = false; };
  }, [blood, area, gender, page, version]);
  useEffect(() => { const timer = window.setInterval(() => { if (document.visibilityState === 'visible') setVersion(v => v + 1); }, 30_000); return () => clearInterval(timer); }, []);
  function clear() { setBlood(''); setArea(''); setGender(''); setPage(0); }
  return <><div className="page-hero"><div className="container"><div className="breadcrumb"><Link href="/">{tx('Home', 'হোম')}</Link><ChevronRight size={13} /><span>{tx('Find donors', 'দাতা খুঁজুন')}</span></div><div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-line" /> {tx('FIND A HELPING HAND', 'সাহায্যকারী হাত খুঁজুন')}</div><h1>{tx('Find a blood donor.', 'রক্তদাতা খুঁজুন।')}</h1><p>{tx('Find potential donors in your community.', 'আপনার কমিউনিটিতে সম্ভাব্য দাতা খুঁজুন।')}</p></div><Link href="/request-blood" className="button button-outline"><Heart size={16} /> {tx('Need blood urgently?', 'জরুরি রক্ত প্রয়োজন?')}</Link></div></div></div>
  <section className="section page-section"><div className="container"><div className="notice notice-neutral page-notice"><Heart size={16} /><span>{tx('Only donors who chose to be listed as available are shown. Confirm availability and details directly; phone numbers are not verified.', 'শুধু উপলব্ধ হিসেবে দেখাতে সম্মত দাতাদের দেখানো হয়। সরাসরি তথ্য ও উপলব্ধতা নিশ্চিত করুন; ফোন নম্বর যাচাই করা নয়।')}</span></div>
    <button className="mobile-filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen}><SlidersHorizontal size={17} /> {tx('Filters', 'ফিল্টার')} <span>{filtersOpen ? '−' : '+'}</span></button>
    <div className="finder-layout"><aside className={`filter-panel card ${filtersOpen ? 'filter-open' : ''}`}><div className="filter-heading"><div><SlidersHorizontal size={18} /><h2>{tx('Filter donors', 'দাতা বাছাই করুন')}</h2></div><button onClick={clear}>{tx('Clear', 'মুছুন')}</button></div><div className="filter-group"><label htmlFor="filter-blood">{tx('Blood group', 'রক্তের গ্রুপ')}</label><select id="filter-blood" value={blood} onChange={e => { setBlood(e.target.value); setPage(0); }}><option value="">{tx('All blood groups', 'সব রক্তের গ্রুপ')}</option>{BLOOD_GROUPS.map(group => <option key={group}>{group}</option>)}</select></div><div className="filter-group"><label htmlFor="filter-area">{tx('Area / upazila', 'এলাকা / উপজেলা')}</label><select id="filter-area" value={area} onChange={e => { setArea(e.target.value); setPage(0); }}><option value="">{tx('All areas', 'সব এলাকা')}</option>{AREAS.map(item => <option key={item}>{item}</option>)}</select></div><div className="filter-group"><label htmlFor="filter-gender">{tx('Gender', 'লিঙ্গ')}</label><select id="filter-gender" value={gender} onChange={e => { setGender(e.target.value); setPage(0); }}><option value="">{tx('Any gender', 'যেকোনো লিঙ্গ')}</option><option value="Male">{tx('Male', 'পুরুষ')}</option><option value="Female">{tx('Female', 'নারী')}</option><option value="Other">{tx('Other', 'অন্যান্য')}</option></select></div><div className="filter-tip"><MapPin size={17} /><p>{tx('Search by area; precise donor distances are not collected.', 'এলাকা দিয়ে খুঁজুন; দাতার সঠিক দূরত্ব সংগ্রহ করা হয় না।')}</p></div></aside>
    <div className="finder-results"><div className="results-heading"><div><h2>{tx('Available donors', 'উপলব্ধ দাতারা')}</h2><p>{donorsLoading ? tx('Finding profiles…', 'প্রোফাইল খোঁজা হচ্ছে…') : donorError ? tx('Directory unavailable', 'তালিকা পাওয়া যাচ্ছে না') : `${donors.length} ${tx('profiles shown', 'টি প্রোফাইল দেখানো হচ্ছে')}`}</p></div></div>
      {donorError ? <div className="notice notice-warning" role="alert">{tx('Could not load the donor directory. Check your connection and try again.', 'দাতার তালিকা লোড করা যায়নি। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।')} <button onClick={() => setVersion(v => v + 1)}>{tx('Retry', 'আবার চেষ্টা')}</button></div> : donorsLoading ? <p className="muted">{tx('Loading…', 'লোড হচ্ছে…')}</p> : donors.length ? <div className="finder-grid">{donors.map(donor => <DonorCard key={donor.id} donor={donor} />)}</div> : <div className="empty-state card"><span><Search size={26} /></span><h3>{tx('No donors found', 'কোনো দাতা পাওয়া যায়নি')}</h3><p>{tx('Try another blood group or area, or create an emergency request.', 'অন্য রক্তের গ্রুপ বা এলাকা বেছে নিন, অথবা জরুরি অনুরোধ তৈরি করুন।')}</p><div><button className="button button-subtle" onClick={clear}><RotateCcw size={15} /> {tx('Clear filters', 'ফিল্টার মুছুন')}</button><Link className="button button-primary" href="/request-blood">{tx('Create a request', 'অনুরোধ তৈরি করুন')} <ArrowRight size={16} /></Link></div></div>}
      {!donorError && !donorsLoading && (page > 0 || donors.length === 24) && <div className="pagination"><button className="button button-subtle" disabled={page === 0} onClick={() => setPage(page - 1)}>{tx('Previous', 'আগের পৃষ্ঠা')}</button><span>{tx('Page', 'পৃষ্ঠা')} {page + 1}</span><button className="button button-subtle" disabled={donors.length < 24} onClick={() => setPage(page + 1)}>{tx('Next', 'পরের পৃষ্ঠা')}</button></div>}
      <p className="disclaimer-line">{tx('A clinician or blood bank must determine actual donation eligibility.', 'প্রকৃত রক্তদানের যোগ্যতা চিকিৎসক বা ব্লাড ব্যাংক নির্ধারণ করবে।')}</p></div></div></div></section></>;
}
