import { Suspense } from 'react';
import { LiveRequests } from '@/components/live-requests';
export default function Page() { return <Suspense fallback={<div className="page-loading">Loading requests…</div>}><LiveRequests /></Suspense>; }
