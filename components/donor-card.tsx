'use client';

import { useCallback, useState } from 'react';
import { CalendarDays, Flag, MapPin, MessageCircle, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { useApp } from './app-provider';
import { BloodBadge, Modal } from './ui';
import { whatsappPhone } from '@/lib/utils';
import type { Donor } from '@/lib/types';

export function DonorCard({ donor }: { donor: Donor }) {
  const { tx, reportDonor } = useApp();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const initials = donor.name.split(' ').map(x => x[0]).slice(0, 2).join('').replace('.', '');
  const statusLabel = donor.status === 'available' ? tx('Available now', 'এখন উপলব্ধ') : donor.status === 'this-week' ? tx('Available this week', 'এই সপ্তাহে উপলব্ধ') : tx('Not available', 'উপলব্ধ নন');
  const donationLabel = donor.lastDonationMonths === null ? tx('No donation recorded', 'রক্তদানের তথ্য নেই') : `${donor.lastDonationMonths} ${tx('months ago', 'মাস আগে')}`;
  return <article className="donor-card card">
    <div className="donor-card-top"><div className="donor-person"><span className={`avatar avatar-${donor.id.charCodeAt(donor.id.length - 1) % 4}`}>{initials}</span><div><div className="donor-name">{donor.name} {donor.verified && <ShieldCheck size={15} aria-label="Demo verified" />}</div><div className={`status status-${donor.status}`}><span />{statusLabel}</div></div></div><BloodBadge group={donor.bloodGroup} /></div>
    <div className="donor-details"><p><MapPin size={15} /><span>{donor.area}</span><span className="detail-right">{donor.distance ? `${donor.distance} km*` : tx('Your profile', 'আপনার প্রোফাইল')}</span></p><p><CalendarDays size={15} /><span>{tx('Last donated', 'সর্বশেষ রক্তদান')}</span><span className="detail-right">{donationLabel}{donor.lastDonationMonths !== null && donor.lastDonationMonths >= 4 ? ` · ${tx('time eligible*', 'সময়ের দিক থেকে যোগ্য*')}` : ''}</span></p></div>
    <div className="donor-card-actions">
      {donor.sample ? <><button className="mini-button" disabled title="Sample number — calls disabled"><Phone size={14} /> {tx('Call', 'কল')}</button><button className="mini-button" disabled title="Sample number — messages disabled"><MessageCircle size={14} /> {tx('WhatsApp', 'হোয়াটসঅ্যাপ')}</button></> : <><a className="mini-button mini-call" href={`tel:${donor.phone}`}><Phone size={14} /> {tx('Call', 'কল')}</a><a className="mini-button" href={`https://wa.me/${whatsappPhone(donor.phone)}`} target="_blank" rel="noreferrer"><MessageCircle size={14} /> {tx('WhatsApp', 'হোয়াটসঅ্যাপ')}</a></>}
      <button className="mini-button mini-profile" onClick={() => setOpen(true)}>{tx('Profile', 'প্রোফাইল')}</button>
    </div>
    {donor.sample && <div className="sample-caption">{tx('Sample profile · calling disabled', 'নমুনা প্রোফাইল · কল বন্ধ')}</div>}
    <Modal open={open} onClose={close} title={tx('Donor profile', 'দাতার প্রোফাইল')}>
      <div className="profile-modal-top"><span className={`avatar avatar-large avatar-${donor.id.charCodeAt(donor.id.length - 1) % 4}`}>{initials}</span><div><h3>{donor.name}</h3><div className={`status status-${donor.status}`}><span />{statusLabel}</div></div><BloodBadge group={donor.bloodGroup} /></div>
      <div className="profile-facts"><p><MapPin size={17} /> {donor.area}</p><p><CalendarDays size={17} /> {tx('Last donated:', 'সর্বশেষ রক্তদান:')} {donationLabel}</p><p><UserRound size={17} /> {donor.donations} {tx('donations recorded', 'টি রক্তদানের তথ্য')}</p></div>
      <div className="notice notice-neutral">{donor.sample ? tx('This is a fictional demo profile. The placeholder phone number cannot be called or messaged.', 'এটি একটি কাল্পনিক ডেমো প্রোফাইল। নমুনা নম্বরে কল বা মেসেজ করা যাবে না।') : tx('This profile is stored only on your device. Demo verification is not real phone verification.', 'এই প্রোফাইল শুধু আপনার ডিভাইসে সংরক্ষিত। ডেমো যাচাই প্রকৃত ফোন যাচাই নয়।')}</div>
      <button className="report-button" onClick={() => { reportDonor(donor.id); close(); }}><Flag size={15} /> {tx('Report a fake number', 'ভুয়া নম্বর রিপোর্ট করুন')}</button>
    </Modal>
  </article>;
}
