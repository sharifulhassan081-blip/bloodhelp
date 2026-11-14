'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronRight, Clock3, Plus, Search } from 'lucide-react';
import { BLOOD_GROUPS } from '@/lib/types';
import { parseSharedRequest } from '@/lib/utils';
import { useApp } from './app-provider';
import { RequestCard } from './request-card';

export function LiveRequests() {
  const { tx, requests, loaded } = useApp();
  const params = useSearchParams();
  const [blood, setBlood] = useState('');
  const [hospital, setHospital] = useState('');
  const [now, setNow] = useState(0);
  useEffect(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(timer); }, []);
  const raw = params.get('request');
  const shared = useMemo(() => parseSharedRequest(raw), [raw]);
  const active = useMemo(() => {
    const combined = shared && (!now || shared.expiresAt > now) && !requests.some(request => request.id === shared.id) ? [shared, ...requests] : requests;
    const urgency = (neededBy: string) => {
      if (neededBy === 'Today') return 0;
      if (neededBy === 'Tomorrow') return 1;
      const day = Date.parse(`${neededBy}T00:00:00`);
      return Number.isFinite(day) ? Math.max(0, Math.ceil((day - (now || Date.now())) / 86_400_000)) : 2;
    };
    return combined.filter(request => (!now || request.expiresAt > now) && (!blood || request.bloodGroup === blood) && (!hospital || request.hospital === hospital)).sort((a, b) => urgency(a.neededBy) - urgency(b.neededBy) || a.expiresAt - b.expiresAt);
  }, [shared, requests, blood, hospital, now]);
  const hospitals = Array.from(new Set([...requests, ...(shared ? [shared] : [])].map(request => request.hospital)));
  return <><div className="page-hero"><div className="container"><div className="breadcrumb"><Link href="/">{tx('Home', 'হোম')}</Link><ChevronRight size={13} /><span>{tx('Live requests', 'জরুরি অনুরোধ')}</span></div><div className="page-title-row"><div><div className="eyebrow"><span className="pulse-dot" /> {tx('HERE FOR EACH OTHER', 'আমরা একে অন্যের পাশে')}</div><h1>{tx('Blood requests.', 'রক্তের অনুরোধ।')}</h1><p>{tx('A helping hand at the right time can mean everything.', 'সঠিক সময়ে একটি সাহায্যের হাত বদলে দিতে পারে সবকিছু।')}</p></div><Link href="/request-blood" className="button button-primary"><Plus size={17} /> {tx('Create a request', 'অনুরোধ তৈরি করুন')}</Link></div></div></div>
    <section className="section page-section"><div className="container"><div className="notice notice-warning"><Clock3 size={18} /><span>{tx('Demo feed: examples and requests created on this device only. New requests are not broadcast to other visitors; share a link directly. Requests expire after 24 hours.', 'ডেমো ফিড: শুধু নমুনা ও এই ডিভাইসে তৈরি অনুরোধ। নতুন অনুরোধ অন্য ব্যবহারকারীদের কাছে যায় না; সরাসরি লিংক শেয়ার করুন। অনুরোধ ২৪ ঘণ্টা পর মেয়াদোত্তীর্ণ হয়।')}</span></div>{raw && (!shared || (!!now && shared.expiresAt <= now)) && <div className="notice notice-neutral spaced-notice">{tx('This shared request is invalid or has expired.', 'শেয়ার করা অনুরোধটি ভুল অথবা মেয়াদ শেষ হয়েছে।')}</div>}{shared && (!now || shared.expiresAt > now) && <div className="notice notice-green spaced-notice">{tx('A request shared by link is included below. Verify its details directly before donating.', 'লিংকে শেয়ার করা একটি অনুরোধ নিচে আছে। রক্ত দেওয়ার আগে সরাসরি তথ্য যাচাই করুন।')}</div>}
      <div className="feed-toolbar"><div><h2>{tx('Active requests', 'সক্রিয় অনুরোধ')}</h2><p>{loaded ? `${active.length} ${tx('requests shown', 'টি অনুরোধ দেখানো হচ্ছে')}` : tx('Loading requests…', 'অনুরোধ লোড হচ্ছে…')}</p></div><div className="feed-filters"><label><span className="sr-only">{tx('Filter by blood group', 'রক্তের গ্রুপ দিয়ে খুঁজুন')}</span><select value={blood} onChange={e => setBlood(e.target.value)}><option value="">{tx('All blood groups', 'সব রক্তের গ্রুপ')}</option>{BLOOD_GROUPS.map(group => <option key={group}>{group}</option>)}</select></label><label><span className="sr-only">{tx('Filter by hospital', 'হাসপাতাল দিয়ে খুঁজুন')}</span><select value={hospital} onChange={e => setHospital(e.target.value)}><option value="">{tx('All hospitals', 'সব হাসপাতাল')}</option>{hospitals.map(item => <option key={item}>{item}</option>)}</select></label></div></div>
      {active.length ? <div className="requests-grid feed-grid">{active.map(request => <RequestCard key={request.id} request={request} />)}</div> : <div className="empty-state card"><span><Search size={26} /></span><h3>{tx('No active requests found', 'কোনো সক্রিয় অনুরোধ পাওয়া যায়নি')}</h3><p>{tx('Try changing your filters or create a new demo request.', 'ফিল্টার পরিবর্তন করুন অথবা একটি নতুন ডেমো অনুরোধ তৈরি করুন।')}</p><Link href="/request-blood" className="button button-primary">{tx('Create a request', 'অনুরোধ তৈরি করুন')} <ArrowRight size={16} /></Link></div>}
    </div></section></>;
}
