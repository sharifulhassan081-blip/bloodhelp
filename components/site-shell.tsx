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
    <div className="demo-banner"><div className="container demo-banner-inner"><span><strong>{tx('DEMO MODE', 'ডেমো সংস্করণ')}</strong><span className="demo-divider"> / </span>{tx('Sample donors & requests. Data stays on this device.', 'নমুনা দাতা ও অনুরোধ। তথ্য শুধু এই ডিভাইসে থাকে।')}</span><a href="tel:999"><Phone size={13} /> {tx('Emergency? Call 999', 'জরুরি সেবা: ৯৯৯')}</a></div></div>
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
      <div className="footer-col footer-promise"><h3>{tx('A note on privacy', 'গোপনীয়তার কথা')}</h3><p><ShieldCheck size={17} /> {tx('We never sell donor data. Demo data stays in your browser.', 'আমরা দাতার তথ্য বিক্রি করি না। ডেমো তথ্য আপনার ব্রাউজারেই থাকে।')}</p><button onClick={() => setPrivacyOpen(true)}>{tx('Read privacy note', 'গোপনীয়তা নীতি')} <ExternalLink size={13} /></button></div>
    </div>
    <div className="container footer-bottom"><span>© {new Date().getFullYear()} Bloodhelp. {tx('A community project.', 'একটি কমিউনিটি উদ্যোগ।')}</span><span>{tx('Made with', 'তৈরি হয়েছে')} <Heart size={13} fill="currentColor" /> {tx('in Sylhet', 'সিলেটের ভালোবাসায়')}</span></div>
    <Modal open={privacyOpen} onClose={close} title={tx('Your privacy matters', 'আপনার গোপনীয়তা গুরুত্বপূর্ণ')}><div className="privacy-copy"><p>{tx('This demonstration does not have a connected database. Donor profiles, requests, reports and camp RSVPs are stored only in this browser. They are not sent to an administrator or shared with other visitors.', 'এই ডেমোতে কোনো ডেটাবেস যুক্ত নেই। দাতার প্রোফাইল, অনুরোধ, রিপোর্ট ও ক্যাম্প নিবন্ধন শুধু এই ব্রাউজারে থাকে। এগুলো প্রশাসক বা অন্য ব্যবহারকারীদের কাছে পাঠানো হয় না।')}</p><p>{tx('If you choose to share a request, its details, including the contact number, are included in the link. Anyone with that link can read them. Clearing browser data deletes your local information.', 'অনুরোধ শেয়ার করলে যোগাযোগ নম্বরসহ বিস্তারিত লিংকে থাকবে। লিংক যাঁদের কাছে থাকবে তাঁরা তথ্য দেখতে পারবেন। ব্রাউজারের তথ্য মুছে ফেললে স্থানীয় তথ্যও মুছে যাবে।')}</p><p>{tx('We do not sell donor data. A production service would require secure storage, authentication and a full privacy policy.', 'আমরা দাতার তথ্য বিক্রি করি না। পূর্ণাঙ্গ সেবার জন্য নিরাপদ ডেটাবেস, পরিচয় যাচাই ও সম্পূর্ণ গোপনীয়তা নীতি প্রয়োজন।')}</p></div><button className="button button-primary modal-action" onClick={close}>{tx('Close', 'বন্ধ করুন')}</button></Modal>
  </footer>;
}
