import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getAuthInstance } from '../firebase';

export interface SuperAdminUser {
  uid: string;
  email: string;
}

let cachedUser: SuperAdminUser | null = null;

export async function loginSuperAdmin(email: string, password: string): Promise<SuperAdminUser> {
  const mode = import.meta.env.VITE_API_MODE || 'demo';

  if (mode === 'demo') {
    cachedUser = { uid: 'demo-super-admin', email };
    return cachedUser;
  }

  const auth = getAuthInstance();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const token = await cred.user.getIdTokenResult();

  if (token.claims.role !== 'super_admin') {
    await signOut(auth);
    throw new Error('Ce compte n\'est pas super administrateur.');
  }

  cachedUser = { uid: cred.user.uid, email: cred.user.email || email };
  return cachedUser;
}

export async function logoutSuperAdmin(): Promise<void> {
  cachedUser = null;
  const mode = import.meta.env.VITE_API_MODE || 'demo';
  if (mode !== 'demo') {
    await signOut(getAuthInstance());
  }
}
