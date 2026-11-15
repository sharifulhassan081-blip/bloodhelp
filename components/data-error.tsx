'use client';

import { useApp } from './app-provider';

export function DataError() {
  const { tx } = useApp();
  return <div className="empty-page"><div className="container"><div className="empty-state card" role="alert"><h1>{tx('Unable to load your data.', 'আপনার তথ্য লোড করা যায়নি।')}</h1><p>{tx('Please check your connection and try again. No changes have been made.', 'সংযোগ পরীক্ষা করে আবার চেষ্টা করুন। কোনো পরিবর্তন করা হয়নি।')}</p><button className="button button-subtle" onClick={() => window.location.reload()}>{tx('Try again', 'আবার চেষ্টা করুন')}</button></div></div></div>;
}
