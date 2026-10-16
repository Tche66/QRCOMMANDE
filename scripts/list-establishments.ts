import { adminDb } from './admin-config.js';

async function main() {
  const snap = await adminDb.collection('establishments').get();

  if (snap.empty) {
    console.log('Aucun etablissement.');
    process.exit(0);
  }

  console.log(`\n${snap.size} etablissement(s) :\n`);
  console.log('  ID                     | Nom                     | Ville          | Statut    | Chambres');
  console.log('  -----------------------|-------------------------|----------------|-----------|--------');

  for (const doc of snap.docs) {
    const d = doc.data();
    const roomsSnap = await adminDb.collection(`establishments/${doc.id}/rooms`).count().get();
    const roomCount = roomsSnap.data().count;

    const id = doc.id.padEnd(22);
    const name = (d.name || '').padEnd(23);
    const city = (d.city || '').padEnd(14);
    const status = (d.status || '').padEnd(9);

    console.log(`  ${id} | ${name} | ${city} | ${status} | ${roomCount}`);
  }

  console.log('');
  process.exit(0);
}

main().catch((err) => {
  console.error('Erreur:', err);
  process.exit(1);
});
