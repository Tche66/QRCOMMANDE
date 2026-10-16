import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from './admin-config.js';

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 ? args[idx + 1] : undefined;
}

const slug = getArg('slug');
const newStatus = getArg('status');

if (!slug || !newStatus) {
  console.log(`
Usage:
  npx tsx scripts/suspend-establishment.ts --slug <slug> --status <status>

Statuts possibles : trial, active, suspended
  `);
  process.exit(1);
}

if (!['trial', 'active', 'suspended'].includes(newStatus)) {
  console.error(`Statut invalide : "${newStatus}". Utiliser : trial, active, suspended`);
  process.exit(1);
}

async function main() {
  const slugDoc = await adminDb.doc(`slugs/${slug}`).get();
  if (!slugDoc.exists) {
    console.error(`Slug "${slug}" introuvable.`);
    process.exit(1);
  }

  const estId = slugDoc.data()!.estId;
  const estDoc = await adminDb.doc(`establishments/${estId}`).get();
  if (!estDoc.exists) {
    console.error(`Etablissement "${estId}" introuvable.`);
    process.exit(1);
  }

  const oldStatus = estDoc.data()!.status;

  if (oldStatus === newStatus) {
    console.log(`L'etablissement est deja en statut "${newStatus}".`);
    process.exit(0);
  }

  await adminDb.doc(`establishments/${estId}`).update({ status: newStatus });

  await adminDb.collection('auditLog').add({
    estId,
    userId: 'super-admin-cli',
    action: 'CHANGE_STATUS',
    details: {
      slug,
      oldStatus,
      newStatus,
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log(`[OK] ${slug} : ${oldStatus} -> ${newStatus}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Erreur:', err);
  process.exit(1);
});
