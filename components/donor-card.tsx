'use client';
import { useCallback, useState } from 'react';
import { Flag, MapPin, MessageCircle, Phone, UserRound } from 'lucide-react';
import { useApp } from './app-provider';
import { BloodBadge, Modal } from './ui';
import { whatsappPhone } from '@/lib/utils';
import type { Donor } from '@/lib/types';

export function DonorCard({ donor }: { donor: Donor }) {
  const { tx, reportDonor } = useApp(); const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false); const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const close = useCallback(() => { setOpen(false); setReporting(false); setMessage(''); setError(''); }, []);
  const submitReport = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await reportDonor(donor.id, reason.trim()); setReason(''); setReporting(false); setMessage(tx('Report saved. There is no automatic staff alert or guaranteed response.', 'রিপোর্ট সংরক্ষিত হয়েছে। স্বয়ংক্রিয়ভাবে কর্মীদের জানানো হয় না বা উত্তরের নিশ্চয়তা নেই।')); }
    catch { setError(tx('Could not save the report. You may have already reported this donor, or there may be a connection problem.', 'রিপোর্ট সংরক্ষণ করা যায়নি। হয়তো আগে রিপোর্ট করেছেন, অথবা সংযোগে সমস্যা হয়েছে।')); }
    finally { setBusy(false); }
  };
  const initials = donor.name.split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase();
  return <article className="donor-card card">
    <div className="donor-card-top"><div className="donor-person"><span className={`avatar avatar-${donor.id.charCodeAt(donor.id.length - 1) % 4}`}>{initials}</span><div><div className="donor-name">{donor.name}</div><div className="status status-available"><span />{tx('Available · self-reported', 'উপলব্ধ · নিজে জানিয়েছেন')}</div></div></div><BloodBadge group={donor.bloodGroup} /></div>
    <div className="donor-details"><p><MapPin size={15} /><span>{donor.area}, Sylhet</span></p><p><UserRound size={15} /><span>{donor.emergency ? tx('Open to emergency calls', 'জরুরি যোগাযোগে ইচ্ছুক') : tx('Not marked for emergencies', 'জরুরি অবস্থার জন্য চিহ্নিত নন')}</span></p></div>
    <div className="donor-card-actions"><a className="mini-button mini-call" href={`tel:${donor.phone}`}><Phone size={14} /> {tx('Call', 'কল')}</a><a className="mini-button" href={`https://wa.me/${whatsappPhone(donor.phone)}`} target="_blank" rel="noreferrer"><MessageCircle size={14} /> {tx('WhatsApp', 'হোয়াটসঅ্যাপ')}</a><button className="mini-button mini-profile" onClick={() => setOpen(true)}>{tx('Profile', 'প্রোফাইল')}</button></div>
    <Modal open={open} onClose={close} title={tx('Donor profile', 'দাতার প্রোফাইল')}><div className="profile-modal-top"><span className="avatar avatar-large">{initials}</span><div><h3>{donor.name}</h3><div className="status"><span />{tx('Available · self-reported', 'উপলব্ধ · নিজে জানিয়েছেন')}</div></div><BloodBadge group={donor.bloodGroup} /></div><div className="profile-facts"><p><MapPin size={17} /> {donor.area}, Sylhet</p><p><Phone size={17} /> {donor.phone}</p></div><div className="notice notice-neutral">{tx('Details and availability are provided by the donor and are not independently verified. A blood bank must assess eligibility.', 'দাতার দেওয়া তথ্য ও উপলব্ধতা স্বাধীনভাবে যাচাই করা হয়নি। রক্তদানের যোগ্যতা ব্লাড ব্যাংক নির্ধারণ করবে।')}</div>
      {message && <p className="notice notice-green spaced-notice" role="status">{message}</p>}
      {!message && !reporting && <button className="report-button" onClick={() => setReporting(true)}><Flag size={15} /> {tx('Report a concern', 'সমস্যা রিপোর্ট করুন')}</button>}
      {reporting && <form onSubmit={submitReport}><label className="form-field modal-field">{tx('What is the concern?', 'সমস্যাটি কী?')}<textarea required minLength={10} maxLength={500} rows={3} value={reason} onChange={e => setReason(e.target.value)} /></label><p className="muted">{tx('Do not include medical details. Reports are stored for the site operator; no automatic staff alert or guaranteed response is provided.', 'চিকিৎসাসংক্রান্ত তথ্য দেবেন না। রিপোর্ট সাইট পরিচালকের জন্য সংরক্ষিত হয়; স্বয়ংক্রিয় সতর্কতা বা উত্তরের নিশ্চয়তা নেই।')}</p>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-subtle" disabled={busy} type="submit">{tx('Submit report', 'রিপোর্ট পাঠান')}</button></form>}
    </Modal>
  </article>;
}
