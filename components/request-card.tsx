'use client';
import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, Clock3, MapPin, Phone } from 'lucide-react';
import type { BloodRequest } from '@/lib/types';
import { countdown, localDate, relativeNeededBy } from '@/lib/utils';
import { useApp } from './app-provider';
import { BloodBadge, Modal } from './ui';

export function RequestCard({ request, compact = false }: { request: BloodRequest; compact?: boolean }) {
  const { tx, updateRequest, ownedRequests, notify } = useApp();
  const [now, setNow] = useState(0); const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  useEffect(() => { setNow(Date.now()); const timer = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(timer); }, []);
  const remaining = now ? countdown(request.expiresAt, now) : null;
  const owner = ownedRequests.some(item => item.id === request.id);
  const received = Math.min(request.unitsReceived, request.units);
  const needed = now ? relativeNeededBy(request.neededBy, localDate(new Date(now))) : request.neededBy;
  const mark = async () => { setBusy(true); try { await updateRequest(request.id, received + 1); close(); notify(tx('Request updated.', 'অনুরোধের তথ্য পরিবর্তন হয়েছে।')); } catch { notify(tx('Could not update the request. Please try again.', 'অনুরোধ পরিবর্তন করা যায়নি। আবার চেষ্টা করুন।')); } finally { setBusy(false); } };
  return <article className={`request-card card ${compact ? 'request-card-compact' : ''}`}>
    <div className="request-card-top"><BloodBadge group={request.bloodGroup} /><div className="request-top-label"><span className="request-priority"><span className="pulse-dot" /> {tx('BLOOD REQUEST', 'রক্তের অনুরোধ')}</span><span className="request-id">{request.id.slice(0, 8).toUpperCase()}</span></div><ArrowUpRight size={19} className="request-arrow" /></div><h3>{request.hospital}</h3><p className="request-location"><MapPin size={15} /> {request.area}, Sylhet</p>
    <div className="request-meta"><span><Clock3 size={15} /> {!remaining ? '—' : !remaining.expired ? `${remaining.hours}h ${remaining.minutes}m ${tx('left', 'বাকি')}` : tx('Expired', 'মেয়াদ শেষ')}</span><span>{needed === 'today' ? tx('Needed today', 'আজ প্রয়োজন') : needed === 'tomorrow' ? tx('Needed tomorrow', 'আগামীকাল প্রয়োজন') : `${tx('Needed by', 'প্রয়োজন')} ${request.neededBy}`}</span></div>
    <div className="progress-row"><span>{tx('Units received', 'ব্যাগ পাওয়া গেছে')}</span><strong>{received} / {request.units}</strong></div><div className="progress-track" aria-label={`${received} of ${request.units} units received`}><span style={{ width: `${received / request.units * 100}%` }} /></div>
    <button className="request-respond" disabled={!!remaining?.expired} onClick={() => setOpen(true)}>{tx('I can donate', 'আমি রক্ত দিতে চাই')} <ArrowUpRight size={16} /></button>
    <Modal open={open} onClose={close} title={tx('Respond to request', 'অনুরোধে সাড়া দিন')}><div className="respond-summary"><BloodBadge group={request.bloodGroup} /><div><strong>{request.hospital}</strong><p>{request.area}, Sylhet · {request.units} {tx('unit(s) needed', 'ব্যাগ প্রয়োজন')}</p></div></div><p className="muted">{tx('Patient', 'রোগী')}: {request.patient}{request.note && <> · {request.note}</>}</p><p className="muted">{tx('Contact the requester directly to confirm the need. No automatic notification is sent. Details and phone numbers are not verified.', 'প্রয়োজন নিশ্চিত করতে অনুরোধকারীর সঙ্গে সরাসরি যোগাযোগ করুন। স্বয়ংক্রিয় নোটিফিকেশন পাঠানো হয় না। তথ্য ও ফোন নম্বর যাচাই করা নয়।')}</p><a className="button button-primary modal-action" href={`tel:${request.phone}`}><Phone size={16} /> {tx('Call', 'কল করুন')} {request.phone}</a>{owner && received < request.units && <button className="text-action" disabled={busy} onClick={mark}>{tx('Mark one unit received', 'এক ব্যাগ পাওয়া গেছে বলে চিহ্নিত করুন')}</button>}</Modal>
  </article>;
}
