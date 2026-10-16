import { randomBytes } from 'crypto';
import { resolve } from 'path';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from './admin-config.js';
import { TEMPLATE_MENU } from './template-menu.js';
import { generateQrPdf, type RoomQR } from './generate-qr-pdf.js';

// ---------- CLI args ----------

const args = process.argv.slice(2);

function getArg(name: string, required = true): string {
  const idx = args.indexOf(`--${name}`);
  const val = idx >= 0 ? args[idx + 1] : undefined;
  if (required && !val) {
    console.error(`Argument --${name} requis`);
    printUsage();
    process.exit(1);
  }
  return val || '';
}

function printUsage() {
  console.log(`
Usage:
  npx tsx scripts/create-establishment.ts \\
    --name "Hotel Palmier" \\
    --slug hotel-palmier \\
    --city Abidjan \\
    --type hotel \\
    --rooms 20 \\
    --reception-phone +2250700000001 \\
    --manager-phone +2250700000002

Options:
  --name             Nom de l'etablissement (requis)
  --slug             Slug unique URL (requis)
  --city             Ville (requis)
  --type             hotel | residence (defaut: hotel)
  --rooms            Nombre de chambres (requis)
  --prefix           Prefixe des numeros (ex: "A" pour A1-A20, vide pour 101-120)
  --start            Numero de depart (defaut: 1 ou 101 selon prefix)
  --reception-phone  Numero de la reception (requis)
  --manager-phone    Numero du gerant (requis)
  --domain           Domaine pour les QR (defaut: localhost:5173)
  `);
}

const name = getArg('name');
const slug = getArg('slug');
const city = getArg('city');
const type = getArg('type', false) || 'hotel';
const roomCount = parseInt(getArg('rooms'), 10);
const prefix = getArg('prefix', false);
const startNum = parseInt(getArg('start', false) || (prefix ? '1' : '101'), 10);
const receptionPhone = getArg('reception-phone');
const managerPhone = getArg('manager-phone');
const domain = getArg('domain', false) || 'localhost:5173';

if (isNaN(roomCount) || roomCount < 1 || roomCount > 200) {
  console.error('Le nombre de chambres doit etre entre 1 et 200');
  process.exit(1);
}

// ---------- Helpers ----------

function randomToken(): string {
  return randomBytes(16).toString('hex');
}

function randomPassword(length: number): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(length);
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

function randomPin(): string {
  const bytes = randomBytes(3);
  const num = (bytes[0] * 65536 + bytes[1] * 256 + bytes[2]) % 1000000;
  return num.toString().padStart(6, '0');
}

// ---------- Main ----------

async function main() {
  console.log(`\nCreation de l'etablissement "${name}" (${slug})...\n`);

  // 1. Verifier que le slug n'existe pas
  const slugDoc = await adminDb.doc(`slugs/${slug}`).get();
  if (slugDoc.exists) {
    console.error(`Le slug "${slug}" existe deja.`);
    process.exit(1);
  }

  const estId = slug;

  // 2. Creer l'etablissement
  await adminDb.doc(`establishments/${estId}`).set({
    slug,
    name,
    city,
    type,
    receptionPhone,
    managerPhone,
    status: 'trial',
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log(`[OK] Etablissement cree : ${estId}`);

  // 3. Creer l'entree slug
  await adminDb.doc(`slugs/${slug}`).set({ estId });
  console.log(`[OK] Slug enregistre : ${slug}`);

  // 4. Creer les chambres avec tokens
  const roomQRs: RoomQR[] = [];
  for (let i = 0; i < roomCount; i++) {
    const roomNumber = prefix ? `${prefix}${startNum + i}` : `${startNum + i}`;
    const qrToken = randomToken();
    const roomId = `room-${roomNumber.toLowerCase()}`;

    await adminDb.doc(`establishments/${estId}/rooms/${roomId}`).set({
      number: roomNumber,
      qrToken,
    });

    await adminDb.doc(`roomTokens/${qrToken}`).set({
      estId,
      roomNumber,
    });

    roomQRs.push({ roomNumber, qrToken });
  }
  console.log(`[OK] ${roomCount} chambres creees (${roomQRs[0].roomNumber} a ${roomQRs[roomQRs.length - 1].roomNumber})`);

  // 5. Dupliquer le menu type
  let catCount = 0;
  let itemCount = 0;
  for (const cat of TEMPLATE_MENU) {
    const catRef = adminDb.collection(`establishments/${estId}/categories`).doc();
    await catRef.set({
      name: cat.name,
      position: cat.position,
    });
    catCount++;

    for (const item of cat.items) {
      const itemRef = adminDb.collection(`establishments/${estId}/items`).doc();
      await itemRef.set({
        categoryId: catRef.id,
        name: item.name,
        priceFcfa: item.priceFcfa,
        available: true,
        position: item.position,
      });
      itemCount++;
    }
  }
  console.log(`[OK] Menu type duplique : ${catCount} categories, ${itemCount} articles`);

  // 6. Creer les comptes utilisateurs
  const receptionEmail = `reception@${slug}.local`;
  const receptionPin = randomPin();
  const managerEmail = `gerant@${slug}.local`;
  const managerPassword = randomPassword(10);

  let receptionUid: string;
  try {
    const receptionUser = await adminAuth.createUser({
      email: receptionEmail,
      password: receptionPin,
      displayName: `Reception ${name}`,
    });
    receptionUid = receptionUser.uid;
  } catch (err: any) {
    if (err.code === 'auth/email-already-exists') {
      const existing = await adminAuth.getUserByEmail(receptionEmail);
      receptionUid = existing.uid;
      await adminAuth.updateUser(receptionUid, { password: receptionPin });
      console.log(`[INFO] Compte reception existant, mot de passe mis a jour`);
    } else {
      throw err;
    }
  }
  await adminAuth.setCustomUserClaims(receptionUid, { role: 'reception', estId });
  console.log(`[OK] Compte reception : ${receptionEmail} / ${receptionPin}`);

  let managerUid: string;
  try {
    const managerUser = await adminAuth.createUser({
      email: managerEmail,
      password: managerPassword,
      displayName: `Gerant ${name}`,
    });
    managerUid = managerUser.uid;
  } catch (err: any) {
    if (err.code === 'auth/email-already-exists') {
      const existing = await adminAuth.getUserByEmail(managerEmail);
      managerUid = existing.uid;
      await adminAuth.updateUser(managerUid, { password: managerPassword });
      console.log(`[INFO] Compte gerant existant, mot de passe mis a jour`);
    } else {
      throw err;
    }
  }
  await adminAuth.setCustomUserClaims(managerUid, { role: 'manager', estId });
  console.log(`[OK] Compte gerant : ${managerEmail} / ${managerPassword}`);

  // 7. Journal d'audit
  await adminDb.collection('auditLog').add({
    estId,
    userId: 'super-admin-cli',
    action: 'CREATE_ESTABLISHMENT',
    details: {
      name,
      slug,
      city,
      type,
      roomCount,
      receptionEmail,
      managerEmail,
    },
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log(`[OK] Entree journal d'audit`);

  // 8. Generer le PDF QR
  const outputPath = resolve(process.cwd(), 'output', `qrcodes-${slug}.pdf`);
  await generateQrPdf(roomQRs, { slug, estName: name, domain, outputPath });
  console.log(`[OK] PDF QR genere : ${outputPath}`);

  // 9. Resume
  console.log(`
========================================
  ETABLISSEMENT CREE AVEC SUCCES
========================================

  Nom          : ${name}
  Slug         : ${slug}
  Ville        : ${city}
  Type         : ${type}
  Statut       : trial
  Chambres     : ${roomCount} (${roomQRs[0].roomNumber} -> ${roomQRs[roomQRs.length - 1].roomNumber})
  Menu         : ${catCount} categories, ${itemCount} articles

  COMPTES :
  Reception    : ${receptionEmail} / ${receptionPin}
  Gerant       : ${managerEmail} / ${managerPassword}

  PDF QR       : ${outputPath}
  Domaine QR   : ${domain}

========================================
  IMPORTANT : Notez les mots de passe ci-dessus.
  Ils ne pourront pas etre retrouves.
========================================
`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Erreur:', err);
  process.exit(1);
});
