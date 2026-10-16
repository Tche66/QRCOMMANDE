import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;
const AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;

if (EMULATOR_HOST) {
  console.log(`[admin] Firestore emulator: ${EMULATOR_HOST}`);
}
if (AUTH_EMULATOR_HOST) {
  console.log(`[admin] Auth emulator: ${AUTH_EMULATOR_HOST}`);
}

const projectId = process.env.FIREBASE_PROJECT_ID || 'commande-qr-demo';

if (EMULATOR_HOST) {
  initializeApp({ projectId });
} else {
  const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!saPath) {
    console.error('GOOGLE_APPLICATION_CREDENTIALS non defini. Requis en production.');
    console.error('Pour utiliser les emulateurs, definir FIRESTORE_EMULATOR_HOST=127.0.0.1:8080');
    process.exit(1);
  }
  const sa = JSON.parse(readFileSync(saPath, 'utf8')) as ServiceAccount;
  initializeApp({ credential: cert(sa), projectId: sa.projectId || projectId });
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
