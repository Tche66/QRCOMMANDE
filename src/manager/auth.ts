import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getAuthInstance } from '../firebase';

export interface ManagerUser {
  uid: string;
  email: string;
  role: string;
  estId: string;
}

let cachedUser: ManagerUser | null = null;

export async function loginManager(slug: string, password: string): Promise<ManagerUser> {
  const mode = import.meta.env.VITE_API_MODE || 'demo';

  if (mode === 'demo') {
    cachedUser = {
      uid: 'demo-manager-uid',
      email: `gerant@${slug}.local`,
      role: 'manager',
      estId: slug === 'hotel-palmier' ? 'demo-hotel-1' : slug === 'residence-cocotier' ? 'demo-residence-2' : slug,
    };
    return cachedUser;
  }

  const auth = getAuthInstance();
  const email = `gerant@${slug}.local`;
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const token = await cred.user.getIdTokenResult();
  const claims = token.claims as { role?: string; estId?: string };

  if (claims.role !== 'manager') {
    await signOut(auth);
    throw new Error('Ce compte n\'a pas les droits de gerant.');
  }

  cachedUser = {
    uid: cred.user.uid,
    email: cred.user.email || email,
    role: claims.role,
    estId: claims.estId || '',
  };
  return cachedUser;
}

export async function logoutManager(): Promise<void> {
  cachedUser = null;
  const mode = import.meta.env.VITE_API_MODE || 'demo';
  if (mode !== 'demo') {
    await signOut(getAuthInstance());
  }
}
