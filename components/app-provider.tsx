'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { donorFromRow, donationFromRow, profileFromRow, profileToRow, requestFromRow, requestToRow } from '@/lib/mappers';
import type { BloodRequest, Donor, DonorProfile, NewBloodRequest, NewDonorProfile } from '@/lib/types';

type Language = 'en' | 'bn';
type AppContextValue = {
  language: Language; setLanguage: (language: Language) => void;
  tx: (english: string, bangla: string) => string;
  dark: boolean; setDark: (dark: boolean) => void;
  loaded: boolean; privateLoading: boolean; user: User | null; configured: boolean;
  donors: Donor[]; donorsLoading: boolean; donorError: string;
  requests: BloodRequest[]; requestsLoading: boolean; requestError: string;
  ownedRequests: BloodRequest[]; privateError: string;
  profile: DonorProfile | null;
  refresh: () => Promise<void>;
  saveProfile: (profile: NewDonorProfile, id?: string) => Promise<DonorProfile>;
  deleteProfile: (id: string) => Promise<void>;
  addDonation: (date: string, location: string) => Promise<void>;
  addRequest: (request: NewBloodRequest) => Promise<BloodRequest>;
  updateRequest: (id: string, unitsReceived: number) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  reportDonor: (id: string, reason: string) => Promise<void>;
  notify: (message: string) => void;
};
const Context = createContext<AppContextValue | null>(null);
const KEYS = { language: 'bloodhelp-language', dark: 'bloodhelp-dark' };
function readJSON<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw) as T; } catch { return fallback; }
}
function writeJSON(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Preferences are optional. */ } }
function db() { if (!supabase) throw new Error('The service is not configured.'); return supabase; }

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [dark, setDark] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [donorsLoading, setDonorsLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [donorError, setDonorError] = useState('');
  const [requestError, setRequestError] = useState('');
  const [privateLoading, setPrivateLoading] = useState(false);
  const [privateOwner, setPrivateOwner] = useState<string | null>(null);
  const [privateError, setPrivateError] = useState('');
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [ownedRequests, setOwnedRequests] = useState<BloodRequest[]>([]);
  const [privateVersion, setPrivateVersion] = useState(0);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tx = useCallback((en: string, bn: string) => language === 'bn' ? bn : en, [language]);
  const refreshPrivate = useCallback(() => setPrivateVersion(v => v + 1), []);

  useEffect(() => {
    setLanguage(readJSON<Language>(KEYS.language, 'en') === 'bn' ? 'bn' : 'en');
    setDark(readJSON<boolean>(KEYS.dark, false));
    if (!supabase) { setLoaded(true); return; }
    let active = true;
    supabase.auth.getSession().then(({ data }) => { if (active) { setUser(data.session?.user ?? null); setLoaded(true); } }).catch(() => { if (active) { setUser(null); setLoaded(true); } });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (active) { setUser(session?.user ?? null); setLoaded(true); } });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.documentElement.lang = language;
    if (loaded) { writeJSON(KEYS.language, language); writeJSON(KEYS.dark, dark); }
  }, [language, dark, loaded]);

  const refresh = useCallback(async () => {
    if (!supabase) { setDonorError('unavailable'); setRequestError('unavailable'); setDonorsLoading(false); setRequestsLoading(false); return; }
    try {
      const [d, r] = await Promise.all([
        supabase.from('public_donors').select('*').order('name').limit(3),
        supabase.from('public_requests').select('*').order('created_at', { ascending: false }).limit(100),
      ]);
      if (d.error) { setDonors([]); setDonorError('unavailable'); } else { setDonors((d.data || []).map(donorFromRow)); setDonorError(''); }
      if (r.error) { setRequests([]); setRequestError('unavailable'); } else { setRequests((r.data || []).map(requestFromRow)); setRequestError(''); }
    } catch { setDonors([]); setRequests([]); setDonorError('unavailable'); setRequestError('unavailable'); }
    finally { setDonorsLoading(false); setRequestsLoading(false); }
  }, []);
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 30_000);
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [refresh]);
  useEffect(() => {
    let active = true;
    setProfile(null); setOwnedRequests([]); setPrivateError('');
    if (!user || !supabase) { setPrivateLoading(false); setPrivateOwner(null); return () => { active = false; }; }
    setPrivateLoading(true);
    Promise.all([
      supabase.from('donor_profiles').select('*').maybeSingle(),
      supabase.from('donations').select('*').order('donated_on', { ascending: false }),
      supabase.from('blood_requests').select('*').order('created_at', { ascending: false }),
    ]).then(([p, h, r]) => {
      if (!active) return;
      if (p.error || h.error || r.error) { setPrivateError('unavailable'); return; }
      const history = (h.data || []).map(donationFromRow);
      setProfile(p.data ? profileFromRow(p.data, history) : null);
      setOwnedRequests((r.data || []).map(requestFromRow));
    }).catch(() => { if (active) setPrivateError('unavailable'); }).finally(() => { if (active) { setPrivateOwner(user.id); setPrivateLoading(false); } });
    return () => { active = false; };
  }, [user?.id, privateVersion]);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const notify = useCallback((message: string) => { setToast(message); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 3500); }, []);
  const saveProfile = useCallback(async (value: NewDonorProfile, id?: string) => {
    const query = id ? db().from('donor_profiles').update(profileToRow(value)).eq('id', id) : db().from('donor_profiles').insert(profileToRow(value));
    const { data, error } = await query.select().single();
    if (error) throw error;
    const result = profileFromRow(data, profile?.history || []);
    setProfile(result); refreshPrivate(); void refresh(); return result;
  }, [profile?.history, refresh, refreshPrivate]);
  const deleteProfile = useCallback(async (id: string) => {
    const { data, error } = await db().from('donor_profiles').delete().eq('id', id).select('id');
    if (error || !data?.length) throw error || new Error('Profile not found.');
    setProfile(null); refreshPrivate(); void refresh();
  }, [refresh, refreshPrivate]);
  const addDonation = useCallback(async (date: string, location: string) => {
    const { error } = await db().from('donations').insert({ donated_on: date, location });
    if (error) throw error;
    refreshPrivate(); void refresh();
  }, [refresh, refreshPrivate]);
  const addRequest = useCallback(async (value: NewBloodRequest) => {
    const { data, error } = await db().from('blood_requests').insert(requestToRow(value)).select().single();
    if (error) throw error;
    const result = requestFromRow(data); refreshPrivate(); void refresh(); return result;
  }, [refresh, refreshPrivate]);
  const updateRequest = useCallback(async (id: string, unitsReceived: number) => {
    const { data, error } = await db().from('blood_requests').update({ units_received: unitsReceived }).eq('id', id).select('id').single();
    if (error || !data) throw error || new Error('Request not found.');
    refreshPrivate(); void refresh();
  }, [refresh, refreshPrivate]);
  const deleteRequest = useCallback(async (id: string) => {
    const { data, error } = await db().from('blood_requests').delete().eq('id', id).select('id');
    if (error || !data?.length) throw error || new Error('Request not found.');
    refreshPrivate(); void refresh();
  }, [refresh, refreshPrivate]);
  const reportDonor = useCallback(async (id: string, reason: string) => {
    const { error } = await db().from('donor_reports').insert({ donor_id: id, reason });
    if (error) throw error;
  }, []);
  const deleteAccount = useCallback(async () => {
    const { error } = await db().rpc('delete_my_account');
    if (error) throw error;
    await db().auth.signOut({ scope: 'local' }); setUser(null); setProfile(null); setOwnedRequests([]); void refresh();
  }, [refresh]);
  return <Context.Provider value={{ language, setLanguage, tx, dark, setDark, loaded, user, configured: !!supabase, donors, donorsLoading, donorError, requests, requestsLoading, requestError, ownedRequests, privateLoading: !!user && (privateLoading || privateOwner !== user.id), privateError, profile, refresh, saveProfile, deleteProfile, addDonation, addRequest, updateRequest, deleteRequest, deleteAccount, reportDonor, notify }}>
    {children}{toast && <div className="toast" role="status">{toast}</div>}
  </Context.Provider>;
}
export function useApp() { const value = useContext(Context); if (!value) throw new Error('useApp must be used inside AppProvider'); return value; }
