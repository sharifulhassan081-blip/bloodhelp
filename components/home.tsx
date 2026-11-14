'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Activity, ArrowDown, ArrowRight, Clock3, Droplet, Heart, HeartHandshake, LifeBuoy, MapPin, MessageCircle, Search, ShieldCheck, UsersRound } from 'lucide-react';
import { AREAS, SAMPLE_DONORS } from '@/lib/data';
import { BLOOD_GROUPS } from '@/lib/types';
import { useApp } from './app-provider';
import { DonorCard } from './donor-card';
import { RequestCard } from './request-card';

export function HomePage() {
  const { tx, requests } = useApp();
  const router = useRouter();
  const [blood, setBlood] = useState('');
  const [area, setArea] = useState('');
  const search = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (blood) params.set('blood', blood);
    if (area) params.set('area', area);
    router.push(`/find-donors${params.size ? `?${params.toString()}` : ''}`);
  };
  const sampleRequests = requests.filter(request => request.sample).slice(0, 3);
  return <>
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-content">
          <div className="eyebrow hero-eyebrow"><span className="eyebrow-line" /> {tx('FOR SYLHET, WITH LOVE', 'সিলেটের জন্য, ভালোবাসায়')}</div>
          <h1>{tx('Blood needed in Sylhet?', 'সিলেটে রক্তের প্রয়োজন?')} <span>{tx('Find a donor in minutes.', 'মিনিটেই খুঁজুন রক্তদাতা।')}</span></h1>
          <p className="hero-description">{tx('When every moment matters, a helping hand can make all the difference. Find the right blood donor, right here in your community.', 'যখন প্রতিটি মুহূর্ত মূল্যবান, একটি সাহায্যের হাত বদলে দিতে পারে সবকিছু। আপনার আশেপাশেই খুঁজে নিন সঠিক রক্তদাতা।')}</p>
          <div className="hero-actions"><Link href="/request-blood" className="button button-primary button-large"><Droplet size={17} /> {tx('I need blood urgently', 'জরুরি রক্ত প্রয়োজন')} <ArrowRight size={17} /></Link><Link href="/register" className="button button-hero-secondary button-large"><Heart size={17} /> {tx('I want to donate', 'রক্ত দিতে চাই')}</Link></div>
          <div className="hero-reassurance"><span className="reassurance-avatars"><i>A</i><i>N</i><i>R</i><i>+</i></span><span><strong>{tx('A community that cares', 'ভালোবাসার এক কমিউনিটি')}</strong><small>{tx('Here for each other, always.', 'সবসময় একে অন্যের পাশে।')}</small></span></div>
        </div>
        <div className="hero-art" aria-label={tx('Illustration of hands holding a blood drop', 'হাতে রক্তবিন্দু ধরে রাখার চিত্র')}>
          <div className="art-orbit art-orbit-one" /><div className="art-orbit art-orbit-two" />
          <Image src="/hero-illustration.webp" alt="" width={1200} height={896} priority className="hero-illustration" />
          <div className="art-chip art-chip-top"><span><Heart size={16} fill="currentColor" /></span><div><strong>{tx('Every drop matters', 'প্রতিটি ফোঁটা মূল্যবান')}</strong><small>{tx('Be someone’s reason to smile', 'হয়ে উঠুন কারও হাসির কারণ')}</small></div></div>
          <div className="art-chip art-chip-bottom"><span><MapPin size={18} /></span><div><strong>Sylhet, Bangladesh</strong><small>{tx('Neighbors helping neighbors', 'পাশে আছি আমরা সবাই')}</small></div></div>
          <span className="art-sparkle sparkle-one">✳</span><span className="art-sparkle sparkle-two">✳</span>
        </div>
      </div>
      <div className="container search-wrap"><div className="search-panel"><div className="search-panel-heading"><div className="search-icon"><Search size={21} /></div><div><h2>{tx('Find the right donor', 'সঠিক রক্তদাতা খুঁজুন')}</h2><p>{tx('A few details can make all the difference.', 'কিছু তথ্যই হতে পারে জীবন বাঁচানোর শুরু।')}</p></div><span className="search-heading-note"><span className="pulse-dot" /> {tx('SEARCH OUR COMMUNITY', 'কমিউনিটিতে খুঁজুন')}</span></div><form className="hero-search-form" onSubmit={search}><label><span>{tx('BLOOD GROUP', 'রক্তের গ্রুপ')}</span><div className="select-wrap"><Droplet size={18} /><select value={blood} onChange={e => setBlood(e.target.value)} aria-label={tx('Select blood group', 'রক্তের গ্রুপ নির্বাচন করুন')}><option value="">{tx('Select blood group', 'রক্তের গ্রুপ নির্বাচন করুন')}</option>{BLOOD_GROUPS.map(group => <option key={group}>{group}</option>)}</select></div></label><label><span>{tx('LOCATION', 'এলাকা')}</span><div className="select-wrap"><MapPin size={18} /><select value={area} onChange={e => setArea(e.target.value)} aria-label={tx('Select area', 'এলাকা নির্বাচন করুন')}><option value="">{tx('Select an area', 'এলাকা নির্বাচন করুন')}</option>{AREAS.map(item => <option key={item}>{item}</option>)}</select></div></label><button type="submit" className="button button-primary search-submit"><Search size={18} /> {tx('Search donors', 'দাতা খুঁজুন')} <ArrowRight size={17} /></button></form></div></div>
    </section>
    <section className="stats-section"><div className="container"><div className="stats-topline"><span>{tx('SMALL ACTS. BIG IMPACT.', 'ছোট উদ্যোগ, বড় প্রভাব।')}</span><span>{tx('Illustrative community statistics', 'উদাহরণস্বরূপ কমিউনিটির পরিসংখ্যান')}</span></div><div className="stats-grid">
      {[{icon: UsersRound, value: '2,450+', label: tx('Total donors', 'মোট রক্তদাতা')}, {icon: Activity, value: '312', label: tx('Available now', 'এখন উপলব্ধ')}, {icon: HeartHandshake, value: '1,180', label: tx('Lives saved', 'জীবন বাঁচানো হয়েছে')}, {icon: LifeBuoy, value: '14', label: tx('Requests fulfilled today', 'আজ পূরণ হয়েছে')}].map(item => <div className="stat-item" key={item.value}><span className="stat-icon"><item.icon size={19} /></span><div><strong>{item.value}</strong><span>{item.label}</span></div></div>)}
    </div></div></section>
    <section className="section how-section" id="how-it-works"><div className="container"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> {tx('SIMPLE AS THAT', 'খুব সহজেই')}</div><h2>{tx('A little help goes a long way.', 'একটু সাহায্যে বদলে যায় অনেক কিছু।')}</h2><p>{tx('Getting help should be simple. Here’s how Bloodhelp connects our community.', 'সাহায্য পাওয়া হওয়া উচিত সহজ। ব্লাডহেল্প যেভাবে আমাদের এক করে।')}</p></div><Link href="/find-donors" className="text-link">{tx('Find a donor', 'দাতা খুঁজুন')} <ArrowRight size={17} /></Link></div><div className="steps-grid">
      {[{icon: Search, number: '01', title: tx('Search for a donor', 'রক্তদাতা খুঁজুন'), text: tx('Choose a blood group and area to find a potential match nearby.', 'রক্তের গ্রুপ ও এলাকা নির্বাচন করে কাছের দাতা খুঁজুন।')}, {icon: MessageCircle, number: '02', title: tx('Make a connection', 'যোগাযোগ করুন'), text: tx('Call or message a donor and confirm the details directly.', 'দাতাকে কল বা মেসেজ করে সরাসরি বিস্তারিত নিশ্চিত করুন।')}, {icon: Heart, number: '03', title: tx('Help save a life', 'জীবন বাঁচাতে সাহায্য করুন'), text: tx('One simple act of kindness can give someone more tomorrows.', 'আপনার একটি ভালো কাজ কাউকে দিতে পারে নতুন জীবন।')}].map(step => <div className="step-card" key={step.number}><div className="step-top"><span className="step-icon"><step.icon size={22} /></span><span className="step-number">{step.number}</span></div><h3>{step.title}</h3><p>{step.text}</p></div>)}
    </div></div></section>
    <section className="section requests-section"><div className="container"><div className="section-heading"><div><div className="eyebrow"><span className="pulse-dot" /> {tx('A COMMUNITY IN ACTION', 'সাহায্যে এগিয়ে আসুন')}</div><h2>{tx('Someone needs your help.', 'আপনার সাহায্য কারও প্রয়োজন।')}</h2><p>{tx('Explore example requests and see how a little help can go a long way.', 'নমুনা অনুরোধগুলো দেখুন এবং জানুন কীভাবে সাহায্য করতে পারেন।')}</p></div><Link href="/live-requests" className="text-link">{tx('View all requests', 'সব অনুরোধ দেখুন')} <ArrowRight size={17} /></Link></div><div className="requests-grid">{sampleRequests.length ? sampleRequests.map(request => <RequestCard key={request.id} request={request} compact />) : <div className="empty-inline">{tx('No example requests are active. You can create a demo request.', 'কোনো নমুনা অনুরোধ সক্রিয় নেই। একটি ডেমো অনুরোধ তৈরি করুন।')}</div>}</div><div className="section-bottom-link"><Link href="/request-blood">{tx('Need blood for someone?', 'কারও জন্য রক্ত প্রয়োজন?')} <strong>{tx('Create a request', 'অনুরোধ তৈরি করুন')}</strong> <ArrowRight size={15} /></Link></div></div></section>
    <section className="section donor-section"><div className="container"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> {tx('GOOD PEOPLE, CLOSE BY', 'কাছের ভালো মানুষেরা')}</div><h2>{tx('Meet your community.', 'পরিচিত হোন আপনার কমিউনিটির সাথে।')}</h2><p>{tx('Every donor is a reminder that kindness is closer than you think.', 'প্রতিটি দাতা মনে করিয়ে দেন, সাহায্য সবসময় কাছেই আছে।')}</p></div><Link href="/find-donors" className="text-link">{tx('View all donors', 'সব দাতা দেখুন')} <ArrowRight size={17} /></Link></div><div className="donors-grid">{SAMPLE_DONORS.slice(0, 3).map(donor => <DonorCard key={donor.id} donor={donor} />)}</div><p className="disclaimer-line">* {tx('Distances are illustrative, measured approximately from Sylhet city centre. Profiles are fictional.', 'দূরত্ব সিলেট শহরের কেন্দ্র থেকে আনুমানিক ও উদাহরণস্বরূপ। প্রোফাইলগুলো কাল্পনিক।')}</p></div></section>
    <section className="section cta-section"><div className="container"><div className="cta-panel"><div className="cta-decoration"><Heart fill="currentColor" size={160} /></div><div><div className="eyebrow light-eyebrow"><span className="eyebrow-line" /> {tx('BE THE REASON', 'হয়ে উঠুন আশার আলো')}</div><h2>{tx('Your blood could be someone’s second chance.', 'আপনার রক্ত হতে পারে কারও নতুন জীবনের আশা।')}</h2><p>{tx('Join a community built on the simple idea that we’re stronger when we help each other.', 'পারস্পরিক সহযোগিতার বিশ্বাসে গড়ে ওঠা এই কমিউনিটির সঙ্গে যোগ দিন।')}</p><Link href="/register" className="button button-white">{tx('Become a donor', 'রক্তদাতা হন')} <ArrowRight size={17} /></Link></div><div className="cta-side-note"><ShieldCheck size={22} /><span>{tx('A small act. A lasting impact.', 'ছোট উদ্যোগ। দীর্ঘস্থায়ী প্রভাব।')}</span></div></div></div></section>
    <section className="home-resource-strip"><div className="container resource-strip-inner"><div><span className="resource-strip-icon"><Droplet size={19} /></span><div><strong>{tx('Know your blood type?', 'আপনার রক্তের গ্রুপ জানেন?')}</strong><p>{tx('See who you can give to and receive from.', 'কাকে রক্ত দিতে ও কার থেকে নিতে পারবেন জেনে নিন।')}</p></div></div><Link href="/resources#compatibility" className="text-link">{tx('Check compatibility', 'সামঞ্জস্য দেখুন')} <ArrowRight size={17} /></Link></div></section>
  </>;
}
