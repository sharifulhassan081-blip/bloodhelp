'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createSampleRequests } from '@/lib/data';
import type { BloodRequest, DonorProfile } from '@/lib/types';

type Language = 'en' | 'bn';
type AppContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  tx: (english: string, bangla: string) => string;
  dark: boolean;
  setDark: (dark: boolean) => void;
  loaded: boolean;
  requests: BloodRequest[];
  addRequest: (request: BloodRequest) => void;
  updateRequest: (id: string, patch: Partial<BloodRequest>) => void;
  profile: DonorProfile | null;
  setProfile: (profile: DonorProfile | null) => void;
  campRegistrations: string[];
  toggleCamp: (id: string) => void;
  reportDonor: (id: string) => void;
  notify: (message: string) => void;
};

const Context = createContext<AppContextValue | null>(null);
const KEYS = { language: 'bloodhelp-language', dark: 'bloodhelp-dark', requests: 'bloodhelp-requests-v1', profile: 'bloodhelp-profile-v1', camps: 'bloodhelp-camps-v1', reports: 'bloodhelp-reports-v1' };

function readJSON<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw) as T; }
  catch { return fallback; }
}
function writeJSON(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Browsing without storage remains possible. */ }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [dark, setDark] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [campRegistrations, setCampRegistrations] = useState<string[]>([]);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const lang = readJSON<Language>(KEYS.language, 'en');
    setLanguage(lang === 'bn' ? 'bn' : 'en');
    setDark(readJSON<boolean>(KEYS.dark, false));
    setRequests(readJSON<BloodRequest[]>(KEYS.requests, createSampleRequests(Date.now())).filter(r => r.expiresAt > Date.now()));
    setProfile(readJSON<DonorProfile | null>(KEYS.profile, null));
    setCampRegistrations(readJSON<string[]>(KEYS.camps, []));
    setLoaded(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.documentElement.lang = language === 'bn' ? 'bn' : 'en';
    if (loaded) { writeJSON(KEYS.language, language); writeJSON(KEYS.dark, dark); }
  }, [language, dark, loaded]);
  useEffect(() => { if (loaded) writeJSON(KEYS.requests, requests); }, [requests, loaded]);
  useEffect(() => { if (loaded) writeJSON(KEYS.profile, profile); }, [profile, loaded]);
  useEffect(() => { if (loaded) writeJSON(KEYS.camps, campRegistrations); }, [campRegistrations, loaded]);
  useEffect(() => {
    const timer = window.setInterval(() => setRequests(previous => {
      const active = previous.filter(request => request.expiresAt > Date.now());
      return active.length === previous.length ? previous : active;
    }), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key === KEYS.requests) setRequests(readJSON<BloodRequest[]>(KEYS.requests, []).filter(r => r.expiresAt > Date.now()));
      if (event.key === KEYS.profile) setProfile(readJSON<DonorProfile | null>(KEYS.profile, null));
      if (event.key === KEYS.camps) setCampRegistrations(readJSON<string[]>(KEYS.camps, []));
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3500);
  }, []);
  const tx = useCallback((english: string, bangla: string) => language === 'bn' ? bangla : english, [language]);
  const addRequest = useCallback((request: BloodRequest) => setRequests(previous => [request, ...previous]), []);
  const updateRequest = useCallback((id: string, patch: Partial<BloodRequest>) => setRequests(previous => previous.map(request => request.id === id ? { ...request, ...patch } : request)), []);
  const toggleCamp = useCallback((id: string) => setCampRegistrations(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]), []);
  const reportDonor = useCallback((id: string) => {
    const current = readJSON<string[]>(KEYS.reports, []);
    if (!current.includes(id)) writeJSON(KEYS.reports, [...current, id]);
    notify(language === 'bn' ? 'এই ডেমো রিপোর্টটি শুধু এই ডিভাইসে সংরক্ষিত হয়েছে।' : 'Demo report saved on this device only.');
  }, [language, notify]);

  return <Context.Provider value={{ language, setLanguage, tx, dark, setDark, loaded, requests, addRequest, updateRequest, profile, setProfile, campRegistrations, toggleCamp, reportDonor, notify }}>
    {children}
    {toast && <div className="toast" role="status">{toast}</div>}
  </Context.Provider>;
}

export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
