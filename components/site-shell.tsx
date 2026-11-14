'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowDownToLine, ArrowRight, ExternalLink, Heart, Menu, Moon, Phone, ShieldCheck, Sun, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useApp } from './app-provider';
import { Modal } from './ui';

export function Logo({ footer = false }: { footer?: boolean }) {
  return <Link href="/" className={`brand ${footer ? 'brand-footer' : ''}`} aria-label="Bloodhelp home">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/icon.svg" width="42" height="42" alt="" />
    <span className="brand-copy"><span className="brand-name">blood<span>help</span><i>.</i></span><span className="brand-caption">SYLHET, BANGLADESH</span></span>
  </Link>;
}

export function SiteHeader() {
  const { tx, language, setLanguage, dark, setDark } = useApp();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  const links = [
    { href: '/find-donors', label: tx('Find donors', 'রক্তদাতা খুঁজুন') },
    { href: '/live-requests', label: tx('Live requests', 'জরুরি অনুরোধ') },
    { href: '/#how-it-works', label: tx('How it works', 'যেভাবে কাজ করে') },
    { href: '/resources', label: tx('Resources', 'তথ্যকেন্দ্র') },
    { href: '/dashboard', label: tx('Dashboard', 'ড্যাশবোর্ড') },
    { href: '/account', label: tx('Account', 'অ্যাকাউন্ট') },
  ];
  return <>
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        <nav className="desktop-nav" aria-label={tx('Main navigation', 'প্রধান নেভিগেশন')}>
          {links.map(link => <Link key={link.href} className={pathname === link.href ? 'active' : ''} href={link.href}>{link.label}</Link>)}
        </nav>
        <div className="header-actions">
          <div className="language-switch" aria-label={tx('Choose language', 'ভাষা নির্বাচন করুন')}>
            <button aria-pressed={language === 'en'} className={language === 'en' ? 'selected' : ''} onClick={() => setLanguage('en')}>EN</button>
            <span />
            <button aria-pressed={language === 'bn'} className={language === 'bn' ? 'selected' : ''} onClick={() => setLanguage('bn')}>বাংলা</button>
          </div>
          <button className="theme-button" aria-label={dark ? tx('Switch to light mode', 'লাইট মোড চালু করুন') : tx('Switch to dark mode', 'ডার্ক মোড চালু করুন')} onClick={() => setDark(!dark)}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
          <Link href="/register" className="button button-outline header-join">{tx('Become a donor', 'রক্তদাতা হন')} <ArrowRight size={15} /></Link>
          <button className="mobile-menu-button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>
      {menuOpen && <nav className="mobile-nav" aria-label="Mobile navigation">
        {links.map(link => <Link key={link.href} onClick={() => setMenuOpen(false)} href={link.href}>{link.label}<ArrowRight size={16} /></Link>)}
        <Link className="mobile-join" href="/register" onClick={() => setMenuOpen(false)}>{tx('Become a donor', 'রক্তদাতা হন')}<ArrowRight size={16} /></Link>
      </nav>}
    </header>
    <div className="safety-banner"><div className="container safety-banner-inner"><span>{tx('Confirm donor and request details directly. This service does not send emergency alerts.', 'দাতা ও অনুরোধের তথ্য সরাসরি নিশ্চিত করুন। এই সেবা জরুরি সতর্কতা পাঠায় না।')}</span><a href="tel:999"><Phone size={13} /> {tx('Emergency? Call 999', 'জরুরি সেবা: ৯৯৯')}</a></div></div>
  </>;
}

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
export function InstallApp() {
  const { tx } = useApp();
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') navigator.serviceWorker.register('/sw.js').catch(() => {});
    const handler = (event: Event) => { event.preventDefault(); setInstallEvent(event as InstallEvent); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  const install = async () => {
    if (installEvent) { await installEvent.prompt(); await installEvent.userChoice; setInstallEvent(null); }
    else setShowInstructions(true);
  };
  const close = useCallback(() => setShowInstructions(false), []);
  return <>
    <button className="footer-install" onClick={install}><ArrowDownToLine size={16} /> {tx('Add to home screen', 'হোম স্ক্রিনে যোগ করুন')}</button>
    <Modal open={showInstructions} onClose={close} title={tx('Keep Bloodhelp close', 'ব্লাডহেল্প কাছে রাখুন')}>
      <p className="muted">{tx('To install this app, open your browser menu and choose “Add to Home Screen” or “Install app”. On iPhone, use Share → Add to Home Screen.', 'অ্যাপটি ইনস্টল করতে ব্রাউজারের মেনু থেকে “Add to Home Screen” বা “Install app” নির্বাচন করুন। আইফোনে Share → Add to Home Screen ব্যবহার করুন।')}</p>
      <button className="button button-primary modal-action" onClick={close}>{tx('Got it', 'বুঝেছি')}</button>
    </Modal>
  </>;
}

export function SiteFooter() {
  const { tx } = useApp();
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const close = useCallback(() => setPrivacyOpen(false), []);
  return <footer className="site-footer" id="about">
    <div className="container footer-main">
      <div className="footer-brand-col"><Logo footer /><p>{tx('A little help can make a lifetime of difference. Made for the people of Sylhet.', 'একটু সাহায্য বদলে দিতে পারে একটি জীবন। সিলেটের মানুষের জন্য তৈরি।')}</p><InstallApp /></div>
      <div className="footer-col"><h3>{tx('Explore', 'ঘুরে দেখুন')}</h3><Link href="/find-donors">{tx('Find a donor', 'দাতা খুঁজুন')}</Link><Link href="/live-requests">{tx('Blood requests', 'রক্তের অনুরোধ')}</Link><Link href="/register">{tx('Become a donor', 'রক্তদাতা হন')}</Link><Link href="/dashboard">{tx('Donor dashboard', 'দাতার ড্যাশবোর্ড')}</Link></div>
      <div className="footer-col"><h3>{tx('Learn', 'জানুন')}</h3><Link href="/resources#compatibility">{tx('Blood compatibility', 'রক্তের সামঞ্জস্য')}</Link><Link href="/resources#eligibility">{tx('Donation guidelines', 'রক্তদানের নিয়ম')}</Link><Link href="/resources#camps">{tx('Donation camps', 'রক্তদান ক্যাম্প')}</Link><Link href="/resources#contacts">{tx('Emergency contacts', 'জরুরি যোগাযোগ')}</Link></div>
      <div className="footer-col footer-promise"><h3>{tx('A note on privacy', 'গোপনীয়তার কথা')}</h3><p><ShieldCheck size={17} /> {tx('You control your profile and can remove your records.', 'আপনি নিজের প্রোফাইল নিয়ন্ত্রণ ও তথ্য মুছে ফেলতে পারেন।')}</p><button onClick={() => setPrivacyOpen(true)}>{tx('Read privacy note', 'গোপনীয়তা নীতি')} <ExternalLink size={13} /></button></div>
    </div>
    <div className="container footer-bottom"><span>© {new Date().getFullYear()} Bloodhelp. {tx('A community project.', 'একটি কমিউনিটি উদ্যোগ।')}</span><span>{tx('Made with', 'তৈরি হয়েছে')} <Heart size={13} fill="currentColor" /> {tx('in Sylhet', 'সিলেটের ভালোবাসায়')}</span></div>
    <Modal open={privacyOpen} onClose={close} title={tx('Your privacy matters', 'আপনার গোপনীয়তা গুরুত্বপূর্ণ')}><div className="privacy-copy"><p>{tx('Your account and records are stored in Supabase. If you consent and are listed as available, your name, blood group, gender, area, phone number and emergency preference are visible to anyone. Your birth date, weight, health answer and donation history are private to your account.', 'আপনার অ্যাকাউন্ট ও তথ্য Supabase-এ সংরক্ষিত। সম্মতি দিয়ে উপলব্ধ থাকলে আপনার নাম, রক্তের গ্রুপ, লিঙ্গ, এলাকা, ফোন নম্বর ও জরুরি অবস্থার পছন্দ সবাই দেখতে পারবেন। জন্মতারিখ, ওজন, স্বাস্থ্যসংক্রান্ত উত্তর ও রক্তদানের ইতিহাস আপনার অ্যাকাউন্টে ব্যক্তিগত থাকে।')}</p><p>{tx('Active requests, including patient details and contact number, are public. They leave the public feed after 24 hours or when fulfilled, but remain in your account until you delete them. Anyone may copy information while it is public.', 'সক্রিয় অনুরোধ, রোগীর তথ্য ও যোগাযোগ নম্বর সবার জন্য উন্মুক্ত। ২৪ ঘণ্টা পর বা পূরণ হলে তালিকা থেকে সরানো হয়, কিন্তু আপনি না মুছলে অ্যাকাউন্টে থাকে। উন্মুক্ত তথ্য যে কেউ কপি করতে পারেন।')}</p><p>{tx('You may delete your donor profile and requests, or delete your entire account and its records. Reports are stored privately for the site operator, without an automatic staff alert. Phone numbers and submitted information are not independently verified.', 'দাতা প্রোফাইল ও অনুরোধ আলাদাভাবে অথবা সম্পূর্ণ অ্যাকাউন্ট ও তার তথ্য মুছে ফেলতে পারবেন। রিপোর্ট সাইট পরিচালকের জন্য ব্যক্তিগতভাবে সংরক্ষিত হয়; স্বয়ংক্রিয় সতর্কতা নেই। ফোন নম্বর ও প্রদত্ত তথ্য স্বাধীনভাবে যাচাই করা হয় না।')}</p></div><button className="button button-primary modal-action" onClick={close}>{tx('Close', 'বন্ধ করুন')}</button></Modal>
  </footer>;
}
