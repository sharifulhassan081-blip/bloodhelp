import { Suspense } from 'react';
import { RegisterDonor } from '@/components/register-donor';
export default function Page() { return <Suspense fallback={<div className="page-loading">Loading…</div>}><RegisterDonor /></Suspense>; }
