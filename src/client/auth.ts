import { signInAnonymously } from 'firebase/auth';
import { getAuthInstance } from '../firebase';

let cachedUid: string | null = null;

export async function ensureAnonymousAuth(): Promise<string> {
  if (cachedUid) return cachedUid;

  const mode = import.meta.env.VITE_API_MODE || 'demo';

  if (mode === 'demo') {
    cachedUid = 'demo-client-uid';
    return cachedUid;
  }

  const auth = getAuthInstance();
  if (auth.currentUser) {
    cachedUid = auth.currentUser.uid;
    return cachedUid;
  }

  const cred = await signInAnonymously(auth);
  cachedUid = cred.user.uid;
  return cachedUid;
}
