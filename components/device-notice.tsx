'use client';

import { ShieldCheck } from 'lucide-react';
import { useApp } from './app-provider';

export function DeviceNotice() {
  const { tx } = useApp();
  return <div className="notice notice-neutral device-notice"><ShieldCheck size={18} /><span>
    <strong>{tx('No account is needed.', 'অ্যাকাউন্টের প্রয়োজন নেই।')}</strong>{' '}
    {tx('To edit or delete later, use this same browser on this device. Clearing browser data or using private browsing can permanently remove access while your submitted records remain online. Anyone using this browser may manage them.', 'পরে সম্পাদনা বা মুছতে এই ডিভাইসের একই ব্রাউজার ব্যবহার করুন। ব্রাউজারের ডেটা মুছলে বা প্রাইভেট মোড ব্যবহার করলে তথ্য পরিচালনার সুযোগ স্থায়ীভাবে হারাতে পারেন, যদিও জমা দেওয়া তথ্য অনলাইনে থেকে যাবে। এই ব্রাউজার ব্যবহারকারী অন্যরাও তথ্য পরিচালনা করতে পারেন।')}
  </span></div>;
}
