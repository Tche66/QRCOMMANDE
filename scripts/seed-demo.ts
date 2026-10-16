/**
 * Seed script for Firebase emulators.
 * Run with: npx tsx scripts/seed-demo.ts
 * Requires emulators running on default ports.
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, collection, Timestamp } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth';
import { randomBytes } from 'crypto';

const PROJECT_ID = 'commande-qr-demo';

const app = initializeApp({
  apiKey: 'demo-key',
  authDomain: 'localhost',
  projectId: PROJECT_ID,
});

const db = getFirestore(app);
connectFirestoreEmulator(db, 'localhost', 8080);

const auth = getAuth(app);
connectAuthEmulator(auth, 'http://localhost:9099');

function randomToken(): string {
  return randomBytes(16).toString('hex');
}

interface EstablishmentSeed {
  id: string;
  slug: string;
  name: string;
  city: string;
  type: string;
  receptionPhone: string;
  managerPhone: string;
  rooms: { number: string }[];
  categories: { id: string; name: string; position: number }[];
  items: { id: string; categoryId: string; name: string; priceFcfa: number; position: number }[];
}

const establishments: EstablishmentSeed[] = [
  {
    id: 'hotel-palmier',
    slug: 'hotel-palmier',
    name: 'Hotel Palmier',
    city: 'Abidjan',
    type: 'hotel',
    receptionPhone: '+2250700000001',
    managerPhone: '+2250700000002',
    rooms: Array.from({ length: 5 }, (_, i) => ({ number: `${101 + i}` })),
    categories: [
      { id: 'cat-boissons', name: 'Boissons', position: 0 },
      { id: 'cat-repas', name: 'Repas', position: 1 },
      { id: 'cat-services', name: 'Services', position: 2 },
    ],
    items: [
      { id: 'item-eau', categoryId: 'cat-boissons', name: 'Eau minerale 1.5L', priceFcfa: 500, position: 0 },
      { id: 'item-coca', categoryId: 'cat-boissons', name: 'Coca-Cola 33cl', priceFcfa: 600, position: 1 },
      { id: 'item-biere', categoryId: 'cat-boissons', name: 'Biere Flag 65cl', priceFcfa: 1000, position: 2 },
      { id: 'item-jus', categoryId: 'cat-boissons', name: 'Jus de bissap', priceFcfa: 500, position: 3 },
      { id: 'item-poulet', categoryId: 'cat-repas', name: 'Poulet braise + attieke', priceFcfa: 3500, position: 0 },
      { id: 'item-riz', categoryId: 'cat-repas', name: 'Riz sauce graine', priceFcfa: 2500, position: 1 },
      { id: 'item-alloco', categoryId: 'cat-repas', name: 'Alloco poisson', priceFcfa: 2000, position: 2 },
      { id: 'item-linge', categoryId: 'cat-services', name: 'Linge supplementaire', priceFcfa: 1000, position: 0 },
    ],
  },
  {
    id: 'residence-cocotier',
    slug: 'residence-cocotier',
    name: 'Residence Cocotier',
    city: 'Yamoussoukro',
    type: 'residence',
    receptionPhone: '+2250700000003',
    managerPhone: '+2250700000004',
    rooms: Array.from({ length: 5 }, (_, i) => ({ number: `A${i + 1}` })),
    categories: [
      { id: 'cat-boissons-2', name: 'Boissons', position: 0 },
      { id: 'cat-plats-2', name: 'Plats', position: 1 },
      { id: 'cat-extras-2', name: 'Extras', position: 2 },
    ],
    items: [
      { id: 'item-eau-2', categoryId: 'cat-boissons-2', name: 'Eau minerale 0.5L', priceFcfa: 300, position: 0 },
      { id: 'item-gingembre', categoryId: 'cat-boissons-2', name: 'Jus de gingembre', priceFcfa: 500, position: 1 },
      { id: 'item-cafe', categoryId: 'cat-boissons-2', name: 'Cafe Nescafe', priceFcfa: 400, position: 2 },
      { id: 'item-sandwich', categoryId: 'cat-plats-2', name: 'Sandwich poulet', priceFcfa: 2000, position: 0 },
      { id: 'item-omelette', categoryId: 'cat-plats-2', name: 'Omelette fromage', priceFcfa: 1500, position: 1 },
      { id: 'item-savon', categoryId: 'cat-extras-2', name: 'Savon supplementaire', priceFcfa: 500, position: 0 },
    ],
  },
];

async function seed() {
  console.log('Seeding Firebase emulators...\n');

  for (const est of establishments) {
    console.log(`Creating establishment: ${est.name}`);

    await setDoc(doc(db, 'establishments', est.id), {
      slug: est.slug,
      name: est.name,
      city: est.city,
      type: est.type,
      receptionPhone: est.receptionPhone,
      managerPhone: est.managerPhone,
      status: 'active',
      createdAt: Timestamp.now(),
    });

    await setDoc(doc(db, 'slugs', est.slug), { estId: est.id });

    for (const room of est.rooms) {
      const qrToken = randomToken();
      const roomId = `room-${est.slug}-${room.number}`;
      await setDoc(doc(db, `establishments/${est.id}/rooms`, roomId), {
        number: room.number,
        qrToken,
      });
      await setDoc(doc(db, 'roomTokens', qrToken), {
        estId: est.id,
        roomNumber: room.number,
      });
      console.log(`  Room ${room.number} -> token: ${qrToken}`);
    }

    for (const cat of est.categories) {
      await setDoc(doc(db, `establishments/${est.id}/categories`, cat.id), {
        name: cat.name,
        position: cat.position,
      });
    }

    for (const item of est.items) {
      await setDoc(doc(db, `establishments/${est.id}/items`, item.id), {
        categoryId: item.categoryId,
        name: item.name,
        priceFcfa: item.priceFcfa,
        available: true,
        position: item.position,
      });
    }

    console.log(`  ${est.categories.length} categories, ${est.items.length} articles\n`);
  }

  // Create user accounts via Auth emulator
  console.log('Creating user accounts...');

  try {
    await createUserWithEmailAndPassword(auth, 'admin@commande-qr.com', 'admin123456');
    console.log('  Super admin: admin@commande-qr.com / admin123456');
  } catch (e: any) {
    console.log(`  Super admin already exists or error: ${e.message}`);
  }

  try {
    await createUserWithEmailAndPassword(auth, 'reception@hotel-palmier.local', '123456');
    console.log('  Reception Hotel Palmier: reception@hotel-palmier.local / 123456');
  } catch (e: any) {
    console.log(`  Reception Hotel Palmier: ${e.message}`);
  }

  try {
    await createUserWithEmailAndPassword(auth, 'gerant@hotel-palmier.local', 'gerant123');
    console.log('  Gerant Hotel Palmier: gerant@hotel-palmier.local / gerant123');
  } catch (e: any) {
    console.log(`  Gerant Hotel Palmier: ${e.message}`);
  }

  try {
    await createUserWithEmailAndPassword(auth, 'reception@residence-cocotier.local', '123456');
    console.log('  Reception Residence Cocotier: reception@residence-cocotier.local / 123456');
  } catch (e: any) {
    console.log(`  Reception Residence Cocotier: ${e.message}`);
  }

  try {
    await createUserWithEmailAndPassword(auth, 'gerant@residence-cocotier.local', 'gerant123');
    console.log('  Gerant Residence Cocotier: gerant@residence-cocotier.local / gerant123');
  } catch (e: any) {
    console.log(`  Gerant Residence Cocotier: ${e.message}`);
  }

  console.log('\nNote: Custom claims (role, estId) must be set via Firebase Admin SDK.');
  console.log('In emulator mode, the rules tests use authenticatedContext() to simulate claims.\n');
  console.log('Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
