import { signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { getAuthInstance } from '../firebase';

export interface ReceptionUser {
  uid: string;
  email: string;
  role: string;
  estId: string;
}

let cachedUser: ReceptionUser | null = null;

export async function loginReception(slug: string, password: string): Promise<ReceptionUser> {
  const mode = import.meta.env.VITE_API_MODE || 'demo';

  if (mode === 'demo') {
    cachedUser = {
      uid: 'demo-reception-uid',
      email: `reception@${slug}.local`,
      role: 'reception',
      estId: slug === 'hotel-palmier' ? 'demo-hotel-1' : slug === 'residence-cocotier' ? 'demo-residence-2' : slug,
    };
    return cachedUser;
  }

  const auth = getAuthInstance();
  const email = `reception@${slug}.local`;
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const token = await cred.user.getIdTokenResult();
  const claims = token.claims as { role?: string; estId?: string };

  if (!claims.role || !['reception', 'manager'].includes(claims.role)) {
    await signOut(auth);
    throw new Error('Ce compte n\'a pas acces a la reception.');
  }

  cachedUser = {
    uid: cred.user.uid,
    email: cred.user.email || email,
    role: claims.role,
    estId: claims.estId || '',
  };

  return cachedUser;
}

export async function logoutReception(): Promise<void> {
  const mode = import.meta.env.VITE_API_MODE || 'demo';
  cachedUser = null;
  if (mode !== 'demo') {
    const auth = getAuthInstance();
    await signOut(auth);
  }
}

export function getCurrentReceptionUser(): ReceptionUser | null {
  return cachedUser;
}
