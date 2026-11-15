'use client';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { ArrowRight, CalendarDays, ChevronRight, Heart, History, MapPin, Plus, Trash2, UserRound } from 'lucide-react';
import { localToday, nextEligibleDate, profileCanBeAvailable } from '@/lib/utils';
import { useApp } from './app-provider';
import { BloodBadge, Modal, Toggle } from './ui';
import { DataError } from './data-error';
import { DeviceNotice } from './device-notice';

export function Dashboard() {
  const { tx, user, profile, saveProfile, deleteProfile, deleteDeviceData, loaded, privateLoading, privateError, notify, addDonation, ownedRequests, updateRequest, deleteRequest } = useApp();
  const [deleteOpen, setDeleteOpen] = useState(false); const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [date, setDate] = useState(''); const [location, setLocation] = useState(''); const [busy, setBusy] = useState(false);
  const closeDelete = useCallback(() => setDeleteOpen(false), []);
  const closeDeleteAll = useCallback(() => setDeleteAllOpen(false), []);
  const closeHistory = useCallback(() => setHistoryOpen(false), []);
  const closeRequestDelete = useCallback(() => setRequestToDelete(null), []);
  if (!loaded || (user && privateLoading)) return <div className="page-loading">{tx('Loading dashboard…', 'ড্যাশবোর্ড লোড হচ্ছে…')}</div>;
  if (privateError) return <DataError />;
  const displayDate = (value: string) => value ? new Date(`${value}T12:00:00Z`).toLocaleDateString(undefined, { timeZone: 'Asia/Dhaka', year: 'numeric', month: 'long', day: 'numeric' }) : tx('No previous donation recorded', 'আগের রক্তদানের তথ্য নেই');
  const changeAvailability = async (value: boolean) => {
    if (!profile) return; setBusy(true);
    try { await saveProfile({ ...profile, available: value }, profile.id); notify(tx('Availability updated.', 'উপলব্ধতা হালনাগাদ হয়েছে।')); }
    catch { notify(tx('Could not update availability. Please try again.', 'উপলব্ধতা পরিবর্তন করা যায়নি। আবার চেষ্টা করুন।')); }
    finally { setBusy(false); }
  };
  const submitDonation = async (event: React.FormEvent) => {
    event.preventDefault(); if (!date || date > localToday() || !location.trim()) return; setBusy(true);
    try { await addDonation(date, location.trim()); setDate(''); setLocation(''); closeHistory(); notify(tx('Donation saved.', 'রক্তদানের তথ্য সংরক্ষিত হয়েছে।')); }
    catch { notify(tx('Could not save the donation. Please try again.', 'রক্তদানের তথ্য সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।')); }
    finally { setBusy(false); }
  };
  const removeProfile = async () => {
    if (!profile) return; setBusy(true);
    try { await deleteProfile(profile.id); closeDelete(); notify(tx('Your donor profile and history were deleted.', 'আপনার দাতা প্রোফাইল ও ইতিহাস মুছে ফেলা হয়েছে।')); }
    catch { notify(tx('Could not delete your profile. Please try again.', 'প্রোফাইল মুছে ফেলা যায়নি। আবার চেষ্টা করুন।')); }
    finally { setBusy(false); }
  };
  const markReceived = async (id: string, received: number) => {
    setBusy(true); try { await updateRequest(id, received + 1); notify(tx('Request updated.', 'অনুরোধ হালনাগাদ হয়েছে।')); }
    catch { notify(tx('Could not update the request.', 'অনুরোধ হালনাগাদ করা যায়নি।')); } finally { setBusy(false); }
  };
  const removeRequest = async () => {
    if (!requestToDelete) return; setBusy(true);
    try { await deleteRequest(requestToDelete); closeRequestDelete(); notify(tx('Request deleted.', 'অনুরোধ মুছে ফেলা হয়েছে।')); }
    catch { notify(tx('Could not delete the request.', 'অনুরোধ মুছে ফেলা যায়নি।')); }
    finally { setBusy(false); }
  };
  const removeAllData = async () => {
    setBusy(true);
    try { await deleteDeviceData(); closeDeleteAll(); notify(tx('Your records were deleted.', 'আপনার তথ্য মুছে ফেলা হয়েছে।')); }
    catch { notify(tx('Could not delete your records. Please try again.', 'আপনার তথ্য মুছে ফেলা যায়নি। আবার চেষ্টা করুন।')); }
    finally { setBusy(false); }
  };
  const canBeAvailable = profile ? profileCanBeAvailable(profile) : false;
  const eligibleDate = profile ? nextEligibleDate(profile) : '';
  return <><div className="page-hero dashboard-hero"><div className="container"><div className="breadcrumb"><Link href="/">{tx('Home', 'হোম')}</Link><ChevronRight size={13} /><span>{tx('Dashboard', 'ড্যাশবোর্ড')}</span></div><div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-line" /> {tx('YOUR SPACE', 'আপনার নিজস্ব স্থান')}</div><h1>{profile ? <>{tx('Welcome back,', 'স্বাগতম,')} {profile.name.split(' ')[0]}.</> : tx('Your dashboard.', 'আপনার ড্যাশবোর্ড।')}</h1><p>{tx('Manage your donor profile and requests.', 'আপনার দাতা প্রোফাইল ও অনুরোধ পরিচালনা করুন।')}</p></div>{user && <button className="button button-outline" onClick={() => setDeleteAllOpen(true)}><Trash2 size={16} /> {tx('Delete all my data', 'আমার সব তথ্য মুছুন')}</button>}</div></div></div>
    <section className="section page-section"><div className="container"><DeviceNotice />
    <div className="dashboard-layout"><div className="dashboard-main">
      {profile ? <><div className="availability-card card"><div className="availability-content"><div className="availability-icon"><Heart size={21} fill="currentColor" /></div><div><span className="eyebrow">{tx('YOUR AVAILABILITY', 'আপনার উপলব্ধতা')}</span><h2>{profile.available && canBeAvailable ? tx('I am available to donate now', 'আমি এখন রক্ত দিতে প্রস্তুত') : tx('Not available right now', 'আমি এখন উপলব্ধ নই')}</h2><p>{canBeAvailable ? tx('Turn this off to hide your profile from the public directory.', 'উন্মুক্ত তালিকা থেকে প্রোফাইল লুকাতে এটি বন্ধ করুন।') : tx('The basic screen suggests waiting or seeking medical advice. A clinician must assess your eligibility.', 'সাধারণ যাচাই অনুযায়ী অপেক্ষা করুন বা চিকিৎসকের পরামর্শ নিন। যোগ্যতা চিকিৎসক নির্ধারণ করবেন।')}</p></div></div><Toggle checked={profile.available && canBeAvailable} disabled={!canBeAvailable || busy} onChange={changeAvailability} label={tx('I am available to donate now', 'আমি এখন রক্ত দিতে প্রস্তুত')} /></div>
      <div className="dashboard-stat-grid"><div className="dashboard-stat card"><span><CalendarDays size={20} /></span><div><small>{tx('NEXT POSSIBLE DATE', 'পরবর্তী সম্ভাব্য তারিখ')}</small><strong>{eligibleDate ? displayDate(eligibleDate) : tx('Ready for assessment', 'যাচাইয়ের জন্য প্রস্তুত')}</strong><p>{tx('Four months after your last donation; not medical clearance.', 'সর্বশেষ রক্তদানের চার মাস পর; এটি চিকিৎসকের অনুমোদন নয়।')}</p></div></div><div className="dashboard-stat card"><span className="green-icon"><Heart size={20} /></span><div><small>{tx('DONATIONS RECORDED', 'রক্তদানের সংখ্যা')}</small><strong>{profile.history.length}</strong><p>{tx('Self-reported history', 'আপনার দেওয়া ইতিহাস')}</p></div></div></div>
      <div className="history-card card"><div className="card-section-heading"><div><span className="eyebrow">{tx('YOUR JOURNEY', 'আপনার পথচলা')}</span><h2>{tx('Donation history', 'রক্তদানের ইতিহাস')}</h2></div><button className="button button-subtle" onClick={() => setHistoryOpen(true)}><Plus size={16} /> {tx('Add donation', 'রক্তদান যোগ করুন')}</button></div>{profile.history.length ? <div className="timeline">{[...profile.history].sort((a,b) => b.date.localeCompare(a.date)).map(item => <div className="timeline-item" key={item.id}><span className="timeline-dot" /><div><strong>{item.location}</strong><p>{displayDate(item.date)}</p></div><Heart size={16} /></div>)}</div> : <div className="history-empty"><span><History size={22} /></span><strong>{tx('Your story starts with one donation.', 'একটি রক্তদান দিয়েই শুরু হতে পারে আপনার গল্প।')}</strong><p>{tx('Add a donation to keep your personal history here.', 'আপনার ব্যক্তিগত ইতিহাস রাখতে রক্তদানের তথ্য যোগ করুন।')}</p></div>}</div></> : <div className="history-card card"><span className="step-icon"><UserRound size={21} /></span><h2>{tx('Become a donor', 'রক্তদাতা হন')}</h2><p className="muted">{tx('Create a donor profile to join the directory and track your availability.', 'দাতার তালিকায় যোগ দিতে ও উপলব্ধতা জানাতে একটি প্রোফাইল তৈরি করুন।')}</p><Link href="/register" className="button button-primary">{tx('Create donor profile', 'দাতা প্রোফাইল তৈরি করুন')} <ArrowRight size={16} /></Link></div>}
      <div className="history-card card"><div className="card-section-heading"><div><span className="eyebrow">{tx('YOUR REQUESTS', 'আপনার অনুরোধ')}</span><h2>{tx('Manage blood requests', 'রক্তের অনুরোধ পরিচালনা')}</h2></div><Link href="/request-blood" className="button button-subtle"><Plus size={16} /> {tx('New request', 'নতুন অনুরোধ')}</Link></div>
      {!ownedRequests.length ? <p className="muted">{tx('You have not created any requests yet.', 'আপনি এখনো কোনো অনুরোধ তৈরি করেননি।')}</p> : <div className="owned-list">{ownedRequests.map(request => { const active = request.expiresAt > Date.now() && request.unitsReceived < request.units; return <div className="owned-item" key={request.id}><div><strong>{request.bloodGroup} · {request.hospital}</strong><p>{request.unitsReceived} / {request.units} {tx('units received', 'ব্যাগ পাওয়া গেছে')} · {active ? tx('Active', 'সক্রিয়') : request.unitsReceived >= request.units ? tx('Fulfilled', 'পূরণ হয়েছে') : tx('Expired', 'মেয়াদ শেষ')}</p></div><div className="owned-actions">{active && <><button className="button button-subtle" disabled={busy} onClick={() => void markReceived(request.id, request.unitsReceived)}>{tx('+1 received', '+১ পাওয়া গেছে')}</button><Link href={`/live-requests?request=${encodeURIComponent(request.id)}`} className="text-link">{tx('View', 'দেখুন')}</Link></>}<button className="delete-button" disabled={busy} onClick={() => setRequestToDelete(request.id)}><Trash2 size={15} /> {tx('Delete', 'মুছুন')}</button></div></div>; })}</div>}
      </div>
    </div><aside className="dashboard-side">{profile && <div className="dashboard-profile card"><div className="dashboard-avatar-wrap"><div className="dashboard-avatar">{profile.name.split(/\s+/).map(part => part[0]).slice(0,2).join('').toUpperCase()}</div><BloodBadge group={profile.bloodGroup} /></div><h2>{profile.name}</h2><p><MapPin size={14} /> {profile.area}, Sylhet</p><div className="profile-info"><div><span>{tx('Donor ID', 'দাতা আইডি')}</span><strong>{profile.id.slice(0, 8).toUpperCase()}</strong></div><div><span>{tx('Phone', 'ফোন')}</span><strong>{profile.phone}</strong></div><div><span>{tx('Phone verification', 'ফোন যাচাই')}</span><strong>{tx('Not verified', 'যাচাই হয়নি')}</strong></div></div><Link href="/register?edit=1" className="button button-subtle verify-button">{tx('Edit profile', 'প্রোফাইল সম্পাদনা')}</Link><button className="delete-button" onClick={() => setDeleteOpen(true)}><Trash2 size={15} /> {tx('Delete donor profile', 'দাতা প্রোফাইল মুছুন')}</button></div>}<div className="dashboard-reminder"><Heart size={19} /><p>{tx('Thank you for showing up for your community.', 'কমিউনিটির পাশে থাকার জন্য ধন্যবাদ।')}</p></div></aside></div></div></section>
    <Modal open={deleteAllOpen} onClose={closeDeleteAll} title={tx('Delete all your data?', 'আপনার সব তথ্য মুছে ফেলবেন?')}><p className="muted">{tx('This permanently deletes the donor profile, donation history, blood requests and reports created from this browser. This cannot be undone. Backups and copies made by others may remain.', 'এই ব্রাউজার থেকে তৈরি দাতা প্রোফাইল, রক্তদানের ইতিহাস, রক্তের অনুরোধ ও রিপোর্ট স্থায়ীভাবে মুছে যাবে। এটি ফেরানো যাবে না। ব্যাকআপ বা অন্যদের রাখা কপি থেকে যেতে পারে।')}</p><div className="modal-buttons"><button className="button button-subtle" onClick={closeDeleteAll}>{tx('Cancel', 'বাতিল')}</button><button className="button button-primary" disabled={busy} onClick={removeAllData}>{tx('Delete all data', 'সব তথ্য মুছুন')}</button></div></Modal>
    <Modal open={deleteOpen} onClose={closeDelete} title={tx('Delete your donor profile?', 'দাতা প্রোফাইল মুছে ফেলবেন?')}><p className="muted">{tx('This permanently deletes your donor profile and donation history. Your blood requests will remain.', 'এতে আপনার দাতা প্রোফাইল ও রক্তদানের ইতিহাস স্থায়ীভাবে মুছে যাবে। রক্তের অনুরোধ থাকবে।')}</p><div className="modal-buttons"><button className="button button-subtle" onClick={closeDelete}>{tx('Cancel', 'বাতিল')}</button><button className="button button-primary" disabled={busy} onClick={removeProfile}>{tx('Delete profile', 'প্রোফাইল মুছুন')}</button></div></Modal>
    <Modal open={historyOpen} onClose={closeHistory} title={tx('Add a donation', 'রক্তদানের তথ্য যোগ করুন')}><form onSubmit={submitDonation}><label className="form-field modal-field">{tx('Donation date', 'রক্তদানের তারিখ')}<input type="date" required max={localToday()} value={date} onChange={e => setDate(e.target.value)} /></label><label className="form-field modal-field">{tx('Hospital or location', 'হাসপাতাল বা স্থান')}<input required maxLength={120} value={location} onChange={e => setLocation(e.target.value)} /></label><p className="muted">{tx('A recent donation switches your public availability off.', 'সাম্প্রতিক রক্তদান আপনার উন্মুক্ত উপলব্ধতা বন্ধ করে দেয়।')}</p><button className="button button-primary modal-action" disabled={busy} type="submit">{tx('Save donation', 'রক্তদানের তথ্য সংরক্ষণ')}</button></form></Modal>
    <Modal open={!!requestToDelete} onClose={closeRequestDelete} title={tx('Delete this request?', 'অনুরোধ মুছে ফেলবেন?')}><p className="muted">{tx('This permanently removes the request from your dashboard and the public feed.', 'এতে অনুরোধটি আপনার ড্যাশবোর্ড ও উন্মুক্ত তালিকা থেকে স্থায়ীভাবে মুছে যাবে।')}</p><div className="modal-buttons"><button className="button button-subtle" onClick={closeRequestDelete}>{tx('Cancel', 'বাতিল')}</button><button className="button button-primary" disabled={busy} onClick={removeRequest}>{tx('Delete request', 'অনুরোধ মুছুন')}</button></div></Modal>
  </>;
}
