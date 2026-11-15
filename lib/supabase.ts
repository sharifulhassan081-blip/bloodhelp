import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
// These are public browser credentials. Never put a service-role key in the app.
export const supabase = url && key ? createClient(url, key) : null;

// Only create a device session when somebody submits a form or report. Browsing
// the public directory does not create users. Supabase stores the session in
// this browser; it protects each person's private rows with the existing RLS.
let sessionCreation: Promise<void> | null = null;
export function ensureDeviceSession(): Promise<void> {
  if (!sessionCreation) {
    const createIfNeeded = async () => {
      if (!supabase) throw new Error('The service is not configured.');
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (data.session) return;
      const result = await supabase.auth.signInAnonymously();
      if (result.error) throw result.error;
      if (!result.data.session) throw new Error('Could not start a device session.');
    };
    // Avoid two tabs creating different owners simultaneously on browsers that
    // support Web Locks. The module-level promise also coalesces same-tab calls.
    const work = typeof navigator !== 'undefined' && navigator.locks
      ? navigator.locks.request<void>('bloodhelp-device-session', createIfNeeded)
      : createIfNeeded();
    sessionCreation = work.finally(() => { sessionCreation = null; });
  }
  return sessionCreation;
}
