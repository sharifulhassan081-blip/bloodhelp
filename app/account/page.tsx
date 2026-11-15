import { redirect } from 'next/navigation';

// Preserve old account links without showing a sign-in or registration page.
export default function Page() {
  redirect('/dashboard');
}
