'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronRight, Clock3, Plus, Search } from 'lucide-react';
import { BLOOD_GROUPS, type BloodRequest } from '@/lib/types';
import { HOSPITALS } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { requestFromRow } from '@/lib/mappers';
import { useApp } from './app-provider';
import { RequestCard } from './request-card';

export function LiveRequests() {
  const { tx, requests } = useApp();
  const params = useSearchParams(); const sharedId = params.get('request');
  const invalidId = !!sharedId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sharedId);
  const [blood, setBlood] = useState(''); const [hospital, setHospital] = useState(''); const [now, setNow] = useState(0);
  const [page, setPage] = useState(0); const [version, setVersion] = useState(0);
  const [feed, setFeed] = useState<BloodRequest[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(timer); }, []);
  useEffect(() => { setPage(0); }, [sharedId]);
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError('');
      if (invalidId) { setFeed([]); setLoading(false); return; }
      if (!supabase) { setError('unavailable'); setLoading(false); return; }
      let query = supabase.from('public_requests').select('*').order('needed_by').order('expires_at').order('id').range(page * 24, page * 24 + 23);
      if (sharedId) query = query.eq('id', sharedId);
      if (blood) query = query.eq('blood_group', blood);
      if (hospital) query = query.eq('hospital', hospital);
      try {
        const result = await query;
        if (!active) return;
        if (result.error) { setFeed([]); setError('unavailable'); }
        else setFeed((result.data || []).map(requestFromRow));
      } catch { if (active) { setFeed([]); setError('unavailable'); } }
      finally { if (active) setLoading(false); }
    }
    void load(); return () => { active = false; };
  }, [sharedId, invalidId, blood, hospital, page, version, requests]);
  const active = useMemo(() => feed.filter(r => !now || r.expiresAt > now), [feed, now]);
  const hospitals = Array.from(new Set([...HOSPITALS, ...requests.map(request => request.hospital), ...feed.map(request => request.hospital)]));
  return <><div className="page-hero"><div className="container"><div className="breadcrumb"><Link href="/">{tx('Home', 'হোম')}</Link><ChevronRight size={13} /><span>{tx('Live requests', 'জরুরি অনুরোধ')}</span></div><div className="page-title-row"><div><div className="eyebrow"><span className="pulse-dot" /> {tx('HERE FOR EACH OTHER', 'আমরা একে অন্যের পাশে')}</div><h1>{tx('Blood requests.', 'রক্তের অনুরোধ।')}</h1><p>{tx('A helping hand at the right time can mean everything.', 'সঠিক সময়ে একটি সাহায্যের হাত বদলে দিতে পারে সবকিছু।')}</p></div><Link href="/request-blood" className="button button-primary"><Plus size={17} /> {tx('Create a request', 'অনুরোধ তৈরি করুন')}</Link></div></div></div>
    <section className="section page-section"><div className="container"><div className="notice notice-warning"><Clock3 size={18} /><span>{tx('Requests are public, refresh approximately every 30 seconds, and disappear from the feed after 24 hours or when fulfilled. Verify details directly.', 'অনুরোধগুলো সবার জন্য উন্মুক্ত, প্রায় ৩০ সেকেন্ড পরপর হালনাগাদ হয় এবং ২৪ ঘণ্টা পর বা পূরণ হলে তালিকা থেকে সরিয়ে দেওয়া হয়। সরাসরি তথ্য নিশ্চিত করুন।')}</span></div>
    {sharedId && <div className="notice notice-neutral spaced-notice">{!loading && !error && !active.length ? tx('This request is unavailable, fulfilled, expired, or does not match your filters.', 'অনুরোধটি পাওয়া যায়নি, পূরণ হয়েছে, মেয়াদ শেষ হয়েছে বা ফিল্টারের সঙ্গে মেলে না।') : tx('Showing the shared request.', 'শেয়ার করা অনুরোধ দেখানো হচ্ছে।')} <Link href="/live-requests" className="text-link">{tx('View all', 'সব দেখুন')}</Link></div>}
    <div className="feed-toolbar"><div><h2>{tx('Active requests', 'সক্রিয় অনুরোধ')}</h2><p>{loading ? tx('Loading requests…', 'অনুরোধ লোড হচ্ছে…') : error ? tx('Feed unavailable', 'তালিকা পাওয়া যাচ্ছে না') : `${active.length} ${tx('requests shown', 'টি অনুরোধ দেখানো হচ্ছে')}`}</p></div><div className="feed-filters"><label><span className="sr-only">{tx('Filter by blood group', 'রক্তের গ্রুপ দিয়ে খুঁজুন')}</span><select value={blood} onChange={e => { setBlood(e.target.value); setPage(0); }}><option value="">{tx('All blood groups', 'সব রক্তের গ্রুপ')}</option>{BLOOD_GROUPS.map(group => <option key={group}>{group}</option>)}</select></label><label><span className="sr-only">{tx('Filter by hospital', 'হাসপাতাল দিয়ে খুঁজুন')}</span><select value={hospital} onChange={e => { setHospital(e.target.value); setPage(0); }}><option value="">{tx('All hospitals', 'সব হাসপাতাল')}</option>{hospitals.map(item => <option key={item}>{item}</option>)}</select></label></div></div>
    {error ? <div className="notice notice-warning" role="alert">{tx('Could not load requests. Check your connection and try again.', 'অনুরোধ লোড করা যায়নি। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।')} <button onClick={() => setVersion(v => v + 1)}>{tx('Retry', 'আবার চেষ্টা')}</button></div> : loading ? <p className="muted">{tx('Loading…', 'লোড হচ্ছে…')}</p> : active.length ? <div className="requests-grid feed-grid">{active.map(request => <RequestCard key={request.id} request={request} />)}</div> : <div className="empty-state card"><span><Search size={26} /></span><h3>{tx('No active requests found', 'কোনো সক্রিয় অনুরোধ পাওয়া যায়নি')}</h3><p>{tx('Try changing your filters or create a request.', 'ফিল্টার পরিবর্তন করুন অথবা একটি অনুরোধ তৈরি করুন।')}</p><Link href="/request-blood" className="button button-primary">{tx('Create a request', 'অনুরোধ তৈরি করুন')} <ArrowRight size={16} /></Link></div>}
    {!error && !loading && !sharedId && (page > 0 || feed.length === 24) && <div className="pagination"><button className="button button-subtle" disabled={page === 0} onClick={() => setPage(page - 1)}>{tx('Previous', 'আগের পৃষ্ঠা')}</button><span>{tx('Page', 'পৃষ্ঠা')} {page + 1}</span><button className="button button-subtle" disabled={feed.length < 24} onClick={() => setPage(page + 1)}>{tx('Next', 'পরের পৃষ্ঠা')}</button></div>}
    </div></section></>;
}
