import { Suspense } from 'react';
import { FindDonors } from '@/components/find-donors';
export default function Page() { return <Suspense fallback={<div className="page-loading">Loading donors…</div>}><FindDonors /></Suspense>; }
