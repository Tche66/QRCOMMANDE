import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
  type RulesTestContext,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RULES = readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8');
const PROJECT_ID = 'commande-qr-test';

const EST_A = 'est-a';
const EST_B = 'est-b';

let testEnv: RulesTestEnvironment;

function superAdmin(): RulesTestContext {
  return testEnv.authenticatedContext('super-admin-uid', {
    role: 'super_admin',
  });
}

function managerA(): RulesTestContext {
  return testEnv.authenticatedContext('manager-a-uid', {
    role: 'manager',
    estId: EST_A,
  });
}

function managerB(): RulesTestContext {
  return testEnv.authenticatedContext('manager-b-uid', {
    role: 'manager',
    estId: EST_B,
  });
}

function receptionA(): RulesTestContext {
  return testEnv.authenticatedContext('reception-a-uid', {
    role: 'reception',
    estId: EST_A,
  });
}

function receptionB(): RulesTestContext {
  return testEnv.authenticatedContext('reception-b-uid', {
    role: 'reception',
    estId: EST_B,
  });
}

function clientAnon(): RulesTestContext {
  return testEnv.authenticatedContext('client-anon-uid', {});
}

function unauthenticated(): RulesTestContext {
  return testEnv.unauthenticatedContext();
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: RULES,
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, 'establishments', EST_A), {
      slug: 'hotel-a',
      name: 'Hotel A',
      city: 'Abidjan',
      status: 'active',
      receptionPhone: '+225000001',
      managerPhone: '+225000002',
      createdAt: new Date(),
    });

    await setDoc(doc(db, 'establishments', EST_B), {
      slug: 'hotel-b',
      name: 'Hotel B',
      city: 'Yamoussoukro',
      status: 'active',
      receptionPhone: '+225000003',
      managerPhone: '+225000004',
      createdAt: new Date(),
    });

    await setDoc(doc(db, 'slugs', 'hotel-a'), { estId: EST_A });
    await setDoc(doc(db, 'slugs', 'hotel-b'), { estId: EST_B });

    await setDoc(doc(db, 'roomTokens', 'tok-a-1'), { estId: EST_A, roomNumber: '101' });
    await setDoc(doc(db, 'roomTokens', 'tok-b-1'), { estId: EST_B, roomNumber: '201' });

    await setDoc(doc(db, `establishments/${EST_A}/rooms`, 'room-a-1'), { number: '101', qrToken: 'tok-a-1' });
    await setDoc(doc(db, `establishments/${EST_B}/rooms`, 'room-b-1'), { number: '201', qrToken: 'tok-b-1' });

    await setDoc(doc(db, `establishments/${EST_A}/categories`, 'cat-a-1'), { name: 'Boissons', position: 0 });
    await setDoc(doc(db, `establishments/${EST_B}/categories`, 'cat-b-1'), { name: 'Boissons', position: 0 });

    await setDoc(doc(db, `establishments/${EST_A}/items`, 'item-a-1'), {
      categoryId: 'cat-a-1', name: 'Eau', priceFcfa: 500, available: true, position: 0,
    });
    await setDoc(doc(db, `establishments/${EST_B}/items`, 'item-b-1'), {
      categoryId: 'cat-b-1', name: 'Coca', priceFcfa: 600, available: true, position: 0,
    });

    await setDoc(doc(db, `establishments/${EST_A}/orders`, 'order-a-1'), {
      clientUid: 'client-anon-uid',
      roomNumber: '101',
      lines: [{ itemId: 'item-a-1', name: 'Eau', qty: 2, unitPriceFcfa: 500 }],
      totalFcfa: 1000,
      status: 'new',
      source: 'app',
      createdAt: new Date(),
      seenAt: null,
      preparingAt: null,
      deliveredAt: null,
    });

    await setDoc(doc(db, `establishments/${EST_B}/orders`, 'order-b-1'), {
      clientUid: 'other-client-uid',
      roomNumber: '201',
      lines: [{ itemId: 'item-b-1', name: 'Coca', qty: 1, unitPriceFcfa: 600 }],
      totalFcfa: 600,
      status: 'new',
      source: 'app',
      createdAt: new Date(),
      seenAt: null,
      preparingAt: null,
      deliveredAt: null,
    });
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

// ==========================================
// TESTS D'ISOLATION (critiques)
// ==========================================

describe('Isolation inter-etablissements', () => {
  it('manager A ne peut PAS lire les commandes de B', async () => {
    const db = managerA().firestore();
    await assertFails(getDoc(doc(db, `establishments/${EST_B}/orders`, 'order-b-1')));
  });

  it('manager A ne peut PAS lister les commandes de B', async () => {
    const db = managerA().firestore();
    await assertFails(getDocs(collection(db, `establishments/${EST_B}/orders`)));
  });

  it('manager A ne peut PAS ecrire dans le menu de B', async () => {
    const db = managerA().firestore();
    await assertFails(
      setDoc(doc(db, `establishments/${EST_B}/items`, 'item-hack'), {
        categoryId: 'cat-b-1', name: 'Hack', priceFcfa: 0, available: true, position: 99,
      }),
    );
  });

  it('manager A ne peut PAS modifier un article de B', async () => {
    const db = managerA().firestore();
    await assertFails(updateDoc(doc(db, `establishments/${EST_B}/items`, 'item-b-1'), { priceFcfa: 0 }));
  });

  it('reception A ne peut PAS changer le statut d\'une commande de B', async () => {
    const db = receptionA().firestore();
    await assertFails(updateDoc(doc(db, `establishments/${EST_B}/orders`, 'order-b-1'), { status: 'seen' }));
  });

  it('reception A ne peut PAS lister les chambres de B', async () => {
    const db = receptionA().firestore();
    await assertFails(getDocs(collection(db, `establishments/${EST_B}/rooms`)));
  });

  it('manager A ne peut PAS modifier l\'etablissement B', async () => {
    const db = managerA().firestore();
    await assertFails(updateDoc(doc(db, 'establishments', EST_B), { name: 'Hacked' }));
  });
});

// ==========================================
// TESTS DE ROLES - Client anonyme
// ==========================================

describe('Client anonyme', () => {
  it('PEUT lire un etablissement par ID', async () => {
    const db = clientAnon().firestore();
    await assertSucceeds(getDoc(doc(db, 'establishments', EST_A)));
  });

  it('PEUT lire un slug', async () => {
    const db = clientAnon().firestore();
    await assertSucceeds(getDoc(doc(db, 'slugs', 'hotel-a')));
  });

  it('PEUT lire un roomToken', async () => {
    const db = clientAnon().firestore();
    await assertSucceeds(getDoc(doc(db, 'roomTokens', 'tok-a-1')));
  });

  it('NE PEUT PAS lister les slugs', async () => {
    const db = clientAnon().firestore();
    await assertFails(getDocs(collection(db, 'slugs')));
  });

  it('NE PEUT PAS lister les roomTokens', async () => {
    const db = clientAnon().firestore();
    await assertFails(getDocs(collection(db, 'roomTokens')));
  });

  it('PEUT lire le menu (categories)', async () => {
    const db = clientAnon().firestore();
    await assertSucceeds(getDocs(collection(db, `establishments/${EST_A}/categories`)));
  });

  it('PEUT lire le menu (items)', async () => {
    const db = clientAnon().firestore();
    await assertSucceeds(getDocs(collection(db, `establishments/${EST_A}/items`)));
  });

  it('NE PEUT PAS lister les chambres', async () => {
    const db = clientAnon().firestore();
    await assertFails(getDocs(collection(db, `establishments/${EST_A}/rooms`)));
  });

  it('NE PEUT PAS lister les etablissements', async () => {
    const db = clientAnon().firestore();
    await assertFails(getDocs(collection(db, 'establishments')));
  });

  it('PEUT creer une commande valide', async () => {
    const db = clientAnon().firestore();
    const orderRef = doc(db, `establishments/${EST_A}/orders`, 'new-order-1');
    await assertSucceeds(
      setDoc(orderRef, {
        clientUid: 'client-anon-uid',
        roomNumber: '101',
        lines: [{ itemId: 'item-a-1', name: 'Eau', qty: 1, unitPriceFcfa: 500 }],
        totalFcfa: 500,
        status: 'new',
        source: 'app',
        createdAt: serverTimestamp(),
        seenAt: null,
        preparingAt: null,
        deliveredAt: null,
      }),
    );
  });

  it('NE PEUT PAS creer une commande avec un mauvais clientUid', async () => {
    const db = clientAnon().firestore();
    const orderRef = doc(db, `establishments/${EST_A}/orders`, 'bad-uid-order');
    await assertFails(
      setDoc(orderRef, {
        clientUid: 'someone-else',
        roomNumber: '101',
        lines: [{ itemId: 'item-a-1', name: 'Eau', qty: 1, unitPriceFcfa: 500 }],
        totalFcfa: 500,
        status: 'new',
        source: 'app',
        createdAt: serverTimestamp(),
        seenAt: null,
        preparingAt: null,
        deliveredAt: null,
      }),
    );
  });

  it('NE PEUT PAS creer une commande avec un statut different de new', async () => {
    const db = clientAnon().firestore();
    const orderRef = doc(db, `establishments/${EST_A}/orders`, 'bad-status-order');
    await assertFails(
      setDoc(orderRef, {
        clientUid: 'client-anon-uid',
        roomNumber: '101',
        lines: [{ itemId: 'item-a-1', name: 'Eau', qty: 1, unitPriceFcfa: 500 }],
        totalFcfa: 500,
        status: 'delivered',
        source: 'app',
        createdAt: serverTimestamp(),
        seenAt: null,
        preparingAt: null,
        deliveredAt: null,
      }),
    );
  });

  it('NE PEUT PAS creer une commande avec 0 ligne', async () => {
    const db = clientAnon().firestore();
    const orderRef = doc(db, `establishments/${EST_A}/orders`, 'empty-order');
    await assertFails(
      setDoc(orderRef, {
        clientUid: 'client-anon-uid',
        roomNumber: '101',
        lines: [],
        totalFcfa: 0,
        status: 'new',
        source: 'app',
        createdAt: serverTimestamp(),
        seenAt: null,
        preparingAt: null,
        deliveredAt: null,
      }),
    );
  });

  it('NE PEUT PAS creer une commande avec un total negatif', async () => {
    const db = clientAnon().firestore();
    const orderRef = doc(db, `establishments/${EST_A}/orders`, 'neg-total-order');
    await assertFails(
      setDoc(orderRef, {
        clientUid: 'client-anon-uid',
        roomNumber: '101',
        lines: [{ itemId: 'item-a-1', name: 'Eau', qty: 1, unitPriceFcfa: 500 }],
        totalFcfa: -100,
        status: 'new',
        source: 'app',
        createdAt: serverTimestamp(),
        seenAt: null,
        preparingAt: null,
        deliveredAt: null,
      }),
    );
  });

  it('NE PEUT PAS modifier une commande existante', async () => {
    const db = clientAnon().firestore();
    await assertFails(
      updateDoc(doc(db, `establishments/${EST_A}/orders`, 'order-a-1'), { status: 'delivered' }),
    );
  });

  it('NE PEUT PAS supprimer une commande', async () => {
    const db = clientAnon().firestore();
    await assertFails(deleteDoc(doc(db, `establishments/${EST_A}/orders`, 'order-a-1')));
  });

  it('PEUT lire sa propre commande', async () => {
    const db = clientAnon().firestore();
    await assertSucceeds(getDoc(doc(db, `establishments/${EST_A}/orders`, 'order-a-1')));
  });

  it('NE PEUT PAS lire la commande d\'un autre client', async () => {
    const db = clientAnon().firestore();
    await assertFails(getDoc(doc(db, `establishments/${EST_B}/orders`, 'order-b-1')));
  });

  it('NE PEUT PAS modifier le menu', async () => {
    const db = clientAnon().firestore();
    await assertFails(updateDoc(doc(db, `establishments/${EST_A}/items`, 'item-a-1'), { priceFcfa: 0 }));
  });
});

// ==========================================
// TESTS DE ROLES - Utilisateur non connecte
// ==========================================

describe('Utilisateur non authentifie', () => {
  it('PEUT lire un etablissement', async () => {
    const db = unauthenticated().firestore();
    await assertSucceeds(getDoc(doc(db, 'establishments', EST_A)));
  });

  it('PEUT lire un slug', async () => {
    const db = unauthenticated().firestore();
    await assertSucceeds(getDoc(doc(db, 'slugs', 'hotel-a')));
  });

  it('NE PEUT PAS creer une commande', async () => {
    const db = unauthenticated().firestore();
    await assertFails(
      setDoc(doc(db, `establishments/${EST_A}/orders`, 'unauth-order'), {
        clientUid: 'nobody',
        roomNumber: '101',
        lines: [{ itemId: 'item-a-1', name: 'Eau', qty: 1, unitPriceFcfa: 500 }],
        totalFcfa: 500,
        status: 'new',
        source: 'app',
        createdAt: serverTimestamp(),
      }),
    );
  });
});

// ==========================================
// TESTS DE ROLES - Receptionniste
// ==========================================

describe('Receptionniste', () => {
  it('PEUT lister les commandes de son etablissement', async () => {
    const db = receptionA().firestore();
    await assertSucceeds(getDocs(collection(db, `establishments/${EST_A}/orders`)));
  });

  it('PEUT changer le statut d\'une commande (seen)', async () => {
    const db = receptionA().firestore();
    await assertSucceeds(
      updateDoc(doc(db, `establishments/${EST_A}/orders`, 'order-a-1'), {
        status: 'seen',
        seenAt: serverTimestamp(),
      }),
    );
  });

  it('PEUT changer le statut d\'une commande (preparing)', async () => {
    const db = receptionA().firestore();
    await assertSucceeds(
      updateDoc(doc(db, `establishments/${EST_A}/orders`, 'order-a-1'), {
        status: 'preparing',
        preparingAt: serverTimestamp(),
      }),
    );
  });

  it('PEUT changer le statut d\'une commande (delivered)', async () => {
    const db = receptionA().firestore();
    await assertSucceeds(
      updateDoc(doc(db, `establishments/${EST_A}/orders`, 'order-a-1'), {
        status: 'delivered',
        deliveredAt: serverTimestamp(),
      }),
    );
  });

  it('NE PEUT PAS modifier d\'autres champs d\'une commande', async () => {
    const db = receptionA().firestore();
    await assertFails(
      updateDoc(doc(db, `establishments/${EST_A}/orders`, 'order-a-1'), {
        totalFcfa: 0,
      }),
    );
  });

  it('NE PEUT PAS modifier le menu', async () => {
    const db = receptionA().firestore();
    await assertFails(
      updateDoc(doc(db, `establishments/${EST_A}/items`, 'item-a-1'), { priceFcfa: 0 }),
    );
  });

  it('PEUT lire les chambres de son etablissement', async () => {
    const db = receptionA().firestore();
    await assertSucceeds(getDocs(collection(db, `establishments/${EST_A}/rooms`)));
  });

  it('NE PEUT PAS supprimer une commande', async () => {
    const db = receptionA().firestore();
    await assertFails(deleteDoc(doc(db, `establishments/${EST_A}/orders`, 'order-a-1')));
  });
});

// ==========================================
// TESTS DE ROLES - Gerant
// ==========================================

describe('Gerant', () => {
  it('PEUT modifier un article de son etablissement', async () => {
    const db = managerA().firestore();
    await assertSucceeds(
      updateDoc(doc(db, `establishments/${EST_A}/items`, 'item-a-1'), { priceFcfa: 750 }),
    );
  });

  it('PEUT ajouter un article dans son etablissement', async () => {
    const db = managerA().firestore();
    await assertSucceeds(
      addDoc(collection(db, `establishments/${EST_A}/items`), {
        categoryId: 'cat-a-1', name: 'Jus', priceFcfa: 800, available: true, position: 1,
      }),
    );
  });

  it('PEUT supprimer un article de son etablissement', async () => {
    const db = managerA().firestore();
    await assertSucceeds(deleteDoc(doc(db, `establishments/${EST_A}/items`, 'item-a-1')));
  });

  it('PEUT modifier une categorie de son etablissement', async () => {
    const db = managerA().firestore();
    await assertSucceeds(
      updateDoc(doc(db, `establishments/${EST_A}/categories`, 'cat-a-1'), { name: 'Drinks' }),
    );
  });

  it('PEUT modifier les champs autorises de son etablissement', async () => {
    const db = managerA().firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'establishments', EST_A), { receptionPhone: '+225111111' }),
    );
  });

  it('NE PEUT PAS modifier le statut de son etablissement', async () => {
    const db = managerA().firestore();
    await assertFails(
      updateDoc(doc(db, 'establishments', EST_A), { status: 'suspended' }),
    );
  });

  it('NE PEUT PAS modifier le slug de son etablissement', async () => {
    const db = managerA().firestore();
    await assertFails(
      updateDoc(doc(db, 'establishments', EST_A), { slug: 'hacked-slug' }),
    );
  });

  it('PEUT lister les commandes de son etablissement (staff)', async () => {
    const db = managerA().firestore();
    await assertSucceeds(getDocs(collection(db, `establishments/${EST_A}/orders`)));
  });
});

// ==========================================
// TESTS DE ROLES - Super admin
// ==========================================

describe('Super admin', () => {
  it('PEUT lister tous les etablissements', async () => {
    const db = superAdmin().firestore();
    await assertSucceeds(getDocs(collection(db, 'establishments')));
  });

  it('PEUT creer un etablissement', async () => {
    const db = superAdmin().firestore();
    await assertSucceeds(
      setDoc(doc(db, 'establishments', 'est-new'), {
        slug: 'new-hotel',
        name: 'New Hotel',
        status: 'trial',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('PEUT supprimer un etablissement', async () => {
    const db = superAdmin().firestore();
    await assertSucceeds(deleteDoc(doc(db, 'establishments', EST_A)));
  });

  it('PEUT creer un slug', async () => {
    const db = superAdmin().firestore();
    await assertSucceeds(setDoc(doc(db, 'slugs', 'new-slug'), { estId: 'est-new' }));
  });

  it('PEUT creer un roomToken', async () => {
    const db = superAdmin().firestore();
    await assertSucceeds(
      setDoc(doc(db, 'roomTokens', 'new-tok'), { estId: EST_A, roomNumber: '999' }),
    );
  });

  it('PEUT creer une chambre', async () => {
    const db = superAdmin().firestore();
    await assertSucceeds(
      setDoc(doc(db, `establishments/${EST_A}/rooms`, 'new-room'), { number: '999', qrToken: 'new-tok' }),
    );
  });

  it('PEUT lire/ecrire les subscriptions', async () => {
    const db = superAdmin().firestore();
    await assertSucceeds(
      setDoc(doc(db, 'subscriptions', EST_A), { tier: 'basic', status: 'trial' }),
    );
    await assertSucceeds(getDoc(doc(db, 'subscriptions', EST_A)));
  });

  it('PEUT lire/ecrire le journal d\'audit', async () => {
    const db = superAdmin().firestore();
    await assertSucceeds(
      addDoc(collection(db, 'auditLog'), { estId: EST_A, action: 'test', createdAt: serverTimestamp() }),
    );
  });
});

// ==========================================
// TESTS - Etablissement suspendu
// ==========================================

describe('Etablissement suspendu', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await updateDoc(doc(db, 'establishments', EST_A), { status: 'suspended' });
    });
  });

  it('un client NE PEUT PAS commander dans un etablissement suspendu', async () => {
    const db = clientAnon().firestore();
    await assertFails(
      setDoc(doc(db, `establishments/${EST_A}/orders`, 'suspended-order'), {
        clientUid: 'client-anon-uid',
        roomNumber: '101',
        lines: [{ itemId: 'item-a-1', name: 'Eau', qty: 1, unitPriceFcfa: 500 }],
        totalFcfa: 500,
        status: 'new',
        source: 'app',
        createdAt: serverTimestamp(),
        seenAt: null,
        preparingAt: null,
        deliveredAt: null,
      }),
    );
  });
});

// ==========================================
// TESTS - Idempotence des commandes
// ==========================================

describe('Idempotence des commandes', () => {
  it('creer deux fois la meme commande (meme ID) reussit (set ecrase)', async () => {
    const db = clientAnon().firestore();
    const orderData = {
      clientUid: 'client-anon-uid',
      roomNumber: '101',
      lines: [{ itemId: 'item-a-1', name: 'Eau', qty: 2, unitPriceFcfa: 500 }],
      totalFcfa: 1000,
      status: 'new',
      source: 'app',
      createdAt: serverTimestamp(),
      seenAt: null,
      preparingAt: null,
      deliveredAt: null,
    };

    const orderRef = doc(db, `establishments/${EST_A}/orders`, 'idempotent-order');
    await assertSucceeds(setDoc(orderRef, orderData));
    await assertSucceeds(setDoc(orderRef, orderData));
  });
});
