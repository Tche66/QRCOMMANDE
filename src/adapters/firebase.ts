import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../firebase';
import type { Api } from '../api';
import type {
  Establishment,
  Menu,
  Order,
  CreateOrderInput,
  OrderStatus,
  Item,
  Category,
  RoomTokenDoc,
  OrderLine,
} from '../types';

function toDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date();
}

export class FirebaseAdapter implements Api {
  private get db() {
    return getDb();
  }

  async resolveSlug(slug: string): Promise<string | null> {
    const snap = await getDoc(doc(this.db, 'slugs', slug));
    if (!snap.exists()) return null;
    return (snap.data() as { estId: string }).estId;
  }

  async resolveRoomToken(token: string): Promise<RoomTokenDoc | null> {
    const snap = await getDoc(doc(this.db, 'roomTokens', token));
    if (!snap.exists()) return null;
    return snap.data() as RoomTokenDoc;
  }

  async getEstablishment(estId: string): Promise<Establishment | null> {
    const snap = await getDoc(doc(this.db, 'establishments', estId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: snap.id,
      slug: data.slug,
      name: data.name,
      city: data.city,
      type: data.type,
      theme: data.theme,
      receptionPhone: data.receptionPhone,
      managerPhone: data.managerPhone,
      status: data.status,
      createdAt: toDate(data.createdAt),
    };
  }

  async getMenu(estId: string): Promise<Menu> {
    const catsSnap = await getDocs(
      query(collection(this.db, `establishments/${estId}/categories`), orderBy('position')),
    );
    const itemsSnap = await getDocs(
      query(collection(this.db, `establishments/${estId}/items`), orderBy('position')),
    );

    const categories: Category[] = catsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Category[];

    const items: Item[] = itemsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Item[];

    return { categories, items };
  }

  async createOrder(estId: string, input: CreateOrderInput): Promise<Order> {
    const menu = await this.getMenu(estId);
    const lines: OrderLine[] = input.lines.map((line) => {
      const item = menu.items.find((i) => i.id === line.itemId);
      if (!item) throw new Error(`Article introuvable : ${line.itemId}`);
      if (!item.available) throw new Error(`Article indisponible : ${item.name}`);
      return {
        itemId: item.id,
        name: item.name,
        qty: line.qty,
        unitPriceFcfa: item.priceFcfa,
      };
    });

    const totalFcfa = lines.reduce((sum, l) => sum + l.qty * l.unitPriceFcfa, 0);

    const orderData = {
      clientUid: input.clientUid,
      roomNumber: input.roomNumber,
      lines,
      note: input.note || null,
      totalFcfa,
      status: 'new' as const,
      source: 'app' as const,
      createdAt: serverTimestamp(),
      seenAt: null,
      preparingAt: null,
      deliveredAt: null,
    };

    const orderRef = doc(this.db, `establishments/${estId}/orders`, input.clientOrderId);
    await setDoc(orderRef, orderData);

    return {
      id: input.clientOrderId,
      ...orderData,
      createdAt: new Date(),
    };
  }

  watchOrders(
    estId: string,
    onNext: (orders: Order[]) => void,
    onError?: (err: Error) => void,
  ): () => void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      collection(this.db, `establishments/${estId}/orders`),
      where('createdAt', '>=', Timestamp.fromDate(today)),
      orderBy('createdAt', 'desc'),
      limit(100),
    );

    return onSnapshot(
      q,
      (snap) => {
        const orders: Order[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            clientUid: data.clientUid,
            roomNumber: data.roomNumber,
            lines: data.lines,
            note: data.note,
            totalFcfa: data.totalFcfa,
            status: data.status,
            source: data.source,
            createdAt: toDate(data.createdAt),
            seenAt: data.seenAt ? toDate(data.seenAt) : undefined,
            preparingAt: data.preparingAt ? toDate(data.preparingAt) : undefined,
            deliveredAt: data.deliveredAt ? toDate(data.deliveredAt) : undefined,
          };
        });
        onNext(orders);
      },
      onError,
    );
  }

  watchOrder(
    estId: string,
    orderId: string,
    onNext: (order: Order | null, hasPendingWrites: boolean) => void,
  ): () => void {
    const ref = doc(this.db, `establishments/${estId}/orders`, orderId);
    return onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        onNext(null, snap.metadata.hasPendingWrites);
        return;
      }
      const data = snap.data();
      const order: Order = {
        id: snap.id,
        clientUid: data.clientUid,
        roomNumber: data.roomNumber,
        lines: data.lines,
        note: data.note,
        totalFcfa: data.totalFcfa,
        status: data.status,
        source: data.source,
        createdAt: toDate(data.createdAt),
        seenAt: data.seenAt ? toDate(data.seenAt) : undefined,
        preparingAt: data.preparingAt ? toDate(data.preparingAt) : undefined,
        deliveredAt: data.deliveredAt ? toDate(data.deliveredAt) : undefined,
      };
      onNext(order, snap.metadata.hasPendingWrites);
    });
  }

  async updateOrderStatus(
    estId: string,
    orderId: string,
    status: OrderStatus,
  ): Promise<void> {
    const ref = doc(this.db, `establishments/${estId}/orders`, orderId);
    const update: Record<string, unknown> = { status };
    if (status === 'seen') update.seenAt = serverTimestamp();
    if (status === 'preparing') update.preparingAt = serverTimestamp();
    if (status === 'delivered') update.deliveredAt = serverTimestamp();
    await updateDoc(ref, update);
  }

  async updateItem(
    estId: string,
    itemId: string,
    data: Partial<Pick<Item, 'name' | 'priceFcfa' | 'available' | 'position'>>,
  ): Promise<void> {
    await updateDoc(doc(this.db, `establishments/${estId}/items`, itemId), data);
  }

  async createItem(estId: string, data: Omit<Item, 'id'>): Promise<Item> {
    const ref = await addDoc(collection(this.db, `establishments/${estId}/items`), data);
    return { ...data, id: ref.id };
  }

  async deleteItem(estId: string, itemId: string): Promise<void> {
    await deleteDoc(doc(this.db, `establishments/${estId}/items`, itemId));
  }

  async updateCategory(
    estId: string,
    catId: string,
    data: Partial<Pick<Category, 'name' | 'position'>>,
  ): Promise<void> {
    await updateDoc(doc(this.db, `establishments/${estId}/categories`, catId), data);
  }

  async createCategory(estId: string, data: Omit<Category, 'id'>): Promise<Category> {
    const ref = await addDoc(collection(this.db, `establishments/${estId}/categories`), data);
    return { ...data, id: ref.id };
  }

  async deleteCategory(estId: string, catId: string): Promise<void> {
    await deleteDoc(doc(this.db, `establishments/${estId}/categories`, catId));
  }

  async updateEstablishment(
    estId: string,
    data: Partial<{ name: string; receptionPhone: string; managerPhone: string; status: string }>,
  ): Promise<void> {
    await updateDoc(doc(this.db, 'establishments', estId), data);
  }

  async listEstablishments(): Promise<Establishment[]> {
    const snap = await getDocs(collection(this.db, 'establishments'));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        slug: data.slug,
        name: data.name,
        city: data.city,
        type: data.type,
        theme: data.theme,
        receptionPhone: data.receptionPhone,
        managerPhone: data.managerPhone,
        status: data.status,
        createdAt: toDate(data.createdAt),
      };
    });
  }

  async getDayOrders(estId: string): Promise<Order[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const q = query(
      collection(this.db, `establishments/${estId}/orders`),
      where('createdAt', '>=', Timestamp.fromDate(today)),
      orderBy('createdAt', 'desc'),
      limit(200),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        clientUid: data.clientUid,
        roomNumber: data.roomNumber,
        lines: data.lines,
        note: data.note,
        totalFcfa: data.totalFcfa,
        status: data.status,
        source: data.source,
        createdAt: toDate(data.createdAt),
        seenAt: data.seenAt ? toDate(data.seenAt) : undefined,
        preparingAt: data.preparingAt ? toDate(data.preparingAt) : undefined,
        deliveredAt: data.deliveredAt ? toDate(data.deliveredAt) : undefined,
      };
    });
  }
}
