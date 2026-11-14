'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { ArrowRight, LockKeyhole, Trash2, UserRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useApp } from './app-provider';
import { Modal } from './ui';

export function AuthRequired({ next }: { next: string }) {
  const { tx } = useApp();
  return <div className="empty-page"><div className="container"><div className="empty-state card"><span><LockKeyhole size={27} /></span><h1>{tx('Sign in to continue.', 'চালিয়ে যেতে সাইন ইন করুন।')}</h1><p>{tx('An email-confirmed account lets you manage your records securely.', 'ইমেইল নিশ্চিত করা অ্যাকাউন্ট থেকে নিরাপদে তথ্য পরিচালনা করতে পারবেন।')}</p><Link className="button button-primary" href={`/account?next=${encodeURIComponent(next)}`}>{tx('Sign in or create an account', 'সাইন ইন বা অ্যাকাউন্ট তৈরি করুন')} <ArrowRight size={16} /></Link></div></div></div>;
}
export function DataError() {
  const { tx } = useApp();
  return <div className="empty-page"><div className="container"><div className="empty-state card" role="alert"><h1>{tx('Unable to load your data.', 'আপনার তথ্য লোড করা যায়নি।')}</h1><p>{tx('Please check your connection and try again. No changes have been made.', 'সংযোগ পরীক্ষা করে আবার চেষ্টা করুন। কোনো পরিবর্তন করা হয়নি।')}</p><button className="button button-subtle" onClick={() => window.location.reload()}>{tx('Try again', 'আবার চেষ্টা করুন')}</button></div></div></div>;
}
export function Account() {
  const { tx, user, loaded, configured, deleteAccount, notify } = useApp();
  const params = useSearchParams(); const router = useRouter();
  const nextParam = params.get('next') || '/dashboard';
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') && !nextParam.includes('\\') ? nextParam : '/dashboard';
  const recovery = params.get('recovery') === '1';
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const close = useCallback(() => setDeleteOpen(false), []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (!supabase) return;
    setError(''); setMessage(''); setBusy(true);
    try {
      if (recovery && user) {
        const { error } = await supabase.auth.updateUser({ password }); if (error) throw error;
        setPassword(''); setMessage(tx('Password updated. You can continue to your dashboard.', 'পাসওয়ার্ড পরিবর্তন হয়েছে। এখন ড্যাশবোর্ডে যেতে পারেন।'));
        router.replace('/account');
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/account?recovery=1` }); if (error) throw error;
        setMessage(tx('If an account exists, a password reset email will be sent.', 'অ্যাকাউন্ট থাকলে পাসওয়ার্ড পরিবর্তনের ইমেইল পাঠানো হবে।'));
      } else if (mode === 'signup') {
        const url = new URL('/account', window.location.origin); url.searchParams.set('next', next);
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: url.toString() } }); if (error) throw error;
        if (data.session) router.replace(next);
        else setMessage(tx('Check your email for a confirmation link before signing in. Check your spam folder too.', 'সাইন ইন করার আগে ইমেইলে নিশ্চিতকরণ লিংক দেখুন। স্প্যাম ফোল্ডারও দেখুন।'));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password }); if (error) throw error;
        router.replace(next);
      }
    } catch (err) { setError(err instanceof Error ? err.message : tx('Something went wrong. Please try again.', 'সমস্যা হয়েছে। আবার চেষ্টা করুন।')); }
    finally { setBusy(false); }
  };
  const removeAccount = async () => {
    setBusy(true); setError('');
    try { await deleteAccount(); close(); notify(tx('Your account and records were deleted.', 'আপনার অ্যাকাউন্ট ও তথ্য মুছে ফেলা হয়েছে।')); router.push('/'); }
    catch { setError(tx('Could not delete your account. Please try again.', 'অ্যাকাউন্ট মুছে ফেলা যায়নি। আবার চেষ্টা করুন।')); close(); }
    finally { setBusy(false); }
  };
  if (!loaded) return <div className="page-loading">{tx('Loading account…', 'অ্যাকাউন্ট লোড হচ্ছে…')}</div>;
  return <div className="empty-page"><div className="container"><div className="account-card card">
    <div className="eyebrow"><span className="eyebrow-line" /> {tx('YOUR ACCOUNT', 'আপনার অ্যাকাউন্ট')}</div>
    <h1>{user && !recovery ? tx('Your account.', 'আপনার অ্যাকাউন্ট।') : recovery && user ? tx('Set a new password.', 'নতুন পাসওয়ার্ড দিন।') : mode === 'signup' ? tx('Join Bloodhelp.', 'ব্লাডহেল্পে যোগ দিন।') : mode === 'reset' ? tx('Reset your password.', 'পাসওয়ার্ড পরিবর্তন করুন।') : tx('Welcome back.', 'আবার স্বাগতম।')}</h1>
    {process.env.NEXT_PUBLIC_EMAIL_SETUP_PENDING === 'true' && <div className="notice notice-warning"><span>{tx('Email delivery is being configured. New account confirmations and password resets may not reach you yet.', 'ইমেইল সেবা প্রস্তুত করা হচ্ছে। নতুন অ্যাকাউন্ট নিশ্চিতকরণ ও পাসওয়ার্ড রিসেট ইমেইল এখনো না-ও পৌঁছাতে পারে।')}</span></div>}
    {!configured && <p className="form-error" role="alert">{tx('The account service is not configured.', 'অ্যাকাউন্ট সেবা প্রস্তুত নয়।')}</p>}
    {user && !recovery ? <><p className="muted">{tx('Signed in as', 'সাইন ইন করেছেন')} <strong>{user.email}</strong></p><div className="account-links"><Link className="button button-primary" href="/dashboard"><UserRound size={16} /> {tx('Dashboard', 'ড্যাশবোর্ড')}</Link><button className="button button-subtle" onClick={async () => { setError(''); try { const result = await supabase?.auth.signOut(); if (result?.error) throw result.error; router.push('/'); } catch { setError(tx('Could not sign out. Please try again.', 'সাইন আউট করা যায়নি। আবার চেষ্টা করুন।')); } }}>{tx('Sign out', 'সাইন আউট')}</button></div><button className="delete-button" onClick={() => setDeleteOpen(true)}><Trash2 size={15} /> {tx('Delete my account', 'আমার অ্যাকাউন্ট মুছুন')}</button></> : <form onSubmit={submit} className="account-form">
      <p className="muted">{recovery && user ? tx('Choose a password of at least eight characters.', 'অন্তত আট অক্ষরের পাসওয়ার্ড দিন।') : tx('Email confirmation is required to create an account.', 'অ্যাকাউন্ট তৈরিতে ইমেইল নিশ্চিত করতে হবে।')}</p>
      {!(recovery && user) && <label className="form-field">{tx('Email address', 'ইমেইল ঠিকানা')}<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>}
      {(mode !== 'reset' || (recovery && user)) && <label className="form-field">{recovery && user ? tx('New password', 'নতুন পাসওয়ার্ড') : tx('Password', 'পাসওয়ার্ড')}<input type="password" autoComplete={mode === 'signin' && !recovery ? 'current-password' : 'new-password'} minLength={mode === 'signin' && !recovery ? 1 : 8} required value={password} onChange={e => setPassword(e.target.value)} /></label>}
      {message && <p className="notice notice-green" role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary" disabled={busy || !configured} type="submit">{busy ? tx('Please wait…', 'অপেক্ষা করুন…') : recovery && user ? tx('Update password', 'পাসওয়ার্ড পরিবর্তন করুন') : mode === 'signup' ? tx('Create account', 'অ্যাকাউন্ট তৈরি করুন') : mode === 'reset' ? tx('Send reset link', 'রিসেট লিংক পাঠান') : tx('Sign in', 'সাইন ইন')} <ArrowRight size={16} /></button>
      {!recovery && <div className="account-mode"><button type="button" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setMessage(''); setError(''); }}>{mode === 'signup' ? tx('Already have an account? Sign in', 'অ্যাকাউন্ট আছে? সাইন ইন করুন') : tx('New here? Create an account', 'নতুন? অ্যাকাউন্ট তৈরি করুন')}</button><button type="button" onClick={() => { setMode(mode === 'reset' ? 'signin' : 'reset'); setMessage(''); setError(''); }}>{mode === 'reset' ? tx('Back to sign in', 'সাইন ইনে ফিরুন') : tx('Forgot password?', 'পাসওয়ার্ড ভুলে গেছেন?')}</button></div>}
    </form>}
    {message && user && !recovery && <p className="notice notice-green spaced-notice" role="status">{message}</p>}
    {error && user && !recovery && <p className="form-error" role="alert">{error}</p>}
    <Modal open={deleteOpen} onClose={close} title={tx('Delete your account?', 'অ্যাকাউন্ট মুছে ফেলবেন?')}><p className="muted">{tx('This permanently deletes your account, donor profile, donation history and all your requests from the service. This cannot be undone.', 'এতে আপনার অ্যাকাউন্ট, দাতা প্রোফাইল, রক্তদানের ইতিহাস ও সব অনুরোধ স্থায়ীভাবে মুছে যাবে। এটি ফেরানো যাবে না।')}</p><div className="modal-buttons"><button className="button button-subtle" onClick={close}>{tx('Cancel', 'বাতিল')}</button><button className="button button-primary" disabled={busy} onClick={removeAccount}>{tx('Delete account', 'অ্যাকাউন্ট মুছুন')}</button></div></Modal>
  </div></div></div>;
}
