import { Suspense } from 'react';
import { Account } from '@/components/auth';
export default function Page() { return <Suspense fallback={<div className="page-loading">Loading account…</div>}><Account /></Suspense>; }
