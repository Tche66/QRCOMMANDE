import type {
  Api,
} from '../api';
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

const DEMO_EST_ID = 'demo-hotel-1';
const DEMO_EST_ID_2 = 'demo-residence-2';

const establishments: Record<string, Establishment> = {
  [DEMO_EST_ID]: {
    id: DEMO_EST_ID,
    slug: 'hotel-palmier',
    name: 'Hotel Palmier',
    city: 'Abidjan',
    type: 'hotel',
    receptionPhone: '+2250700000001',
    managerPhone: '+2250700000002',
    status: 'active',
    createdAt: new Date(),
  },
  [DEMO_EST_ID_2]: {
    id: DEMO_EST_ID_2,
    slug: 'residence-cocotier',
    name: 'Residence Cocotier',
    city: 'Yamoussoukro',
    type: 'residence',
    receptionPhone: '+2250700000003',
    managerPhone: '+2250700000004',
    status: 'active',
    createdAt: new Date(),
  },
};

const slugs: Record<string, string> = {
  'hotel-palmier': DEMO_EST_ID,
  'residence-cocotier': DEMO_EST_ID_2,
};

const roomTokens: Record<string, RoomTokenDoc> = {
  'tok-h1-ch1': { estId: DEMO_EST_ID, roomNumber: '101' },
  'tok-h1-ch2': { estId: DEMO_EST_ID, roomNumber: '102' },
  'tok-h1-ch3': { estId: DEMO_EST_ID, roomNumber: '103' },
  'tok-r2-ch1': { estId: DEMO_EST_ID_2, roomNumber: 'A1' },
  'tok-r2-ch2': { estId: DEMO_EST_ID_2, roomNumber: 'A2' },
};

const categories: Record<string, Category[]> = {
  [DEMO_EST_ID]: [
    { id: 'cat-boissons', name: 'Boissons', position: 0 },
    { id: 'cat-repas', name: 'Repas', position: 1 },
    { id: 'cat-services', name: 'Services', position: 2 },
  ],
  [DEMO_EST_ID_2]: [
    { id: 'cat-boissons-2', name: 'Boissons', position: 0 },
    { id: 'cat-repas-2', name: 'Plats', position: 1 },
  ],
};

const items: Record<string, Item[]> = {
  [DEMO_EST_ID]: [
    { id: 'item-1', categoryId: 'cat-boissons', name: 'Eau minerale 1.5L', priceFcfa: 500, available: true, position: 0 },
    { id: 'item-2', categoryId: 'cat-boissons', name: 'Coca-Cola 33cl', priceFcfa: 600, available: true, position: 1 },
    { id: 'item-3', categoryId: 'cat-boissons', name: 'Biere Flag 65cl', priceFcfa: 1000, available: true, position: 2 },
    { id: 'item-4', categoryId: 'cat-repas', name: 'Poulet braise + attiéké', priceFcfa: 3500, available: true, position: 0 },
    { id: 'item-5', categoryId: 'cat-repas', name: 'Riz sauce graine', priceFcfa: 2500, available: true, position: 1 },
    { id: 'item-6', categoryId: 'cat-services', name: 'Linge supplementaire', priceFcfa: 1000, available: true, position: 0 },
  ],
  [DEMO_EST_ID_2]: [
    { id: 'item-r2-1', categoryId: 'cat-boissons-2', name: 'Eau minerale 0.5L', priceFcfa: 300, available: true, position: 0 },
    { id: 'item-r2-2', categoryId: 'cat-boissons-2', name: 'Jus de gingembre', priceFcfa: 500, available: true, position: 1 },
    { id: 'item-r2-3', categoryId: 'cat-repas-2', name: 'Sandwich poulet', priceFcfa: 2000, available: true, position: 0 },
  ],
};

const orders: Record<string, Order[]> = {};

export class DemoAdapter implements Api {
  async resolveSlug(slug: string): Promise<string | null> {
    return slugs[slug] ?? null;
  }

  async resolveRoomToken(token: string): Promise<RoomTokenDoc | null> {
    return roomTokens[token] ?? null;
  }

  async getEstablishment(estId: string): Promise<Establishment | null> {
    return establishments[estId] ?? null;
  }

  async getMenu(estId: string): Promise<Menu> {
    return {
      categories: categories[estId] ?? [],
      items: items[estId] ?? [],
    };
  }

  async createOrder(estId: string, input: CreateOrderInput): Promise<Order> {
    const est = establishments[estId];
    if (!est || est.status === 'suspended') {
      throw new Error('Etablissement suspendu ou inexistant');
    }

    const estItems = items[estId] ?? [];
    const lines: OrderLine[] = input.lines.map((line) => {
      const item = estItems.find((i) => i.id === line.itemId);
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

    if (!orders[estId]) orders[estId] = [];
    const existing = orders[estId].find((o) => o.id === input.clientOrderId);
    if (existing) return existing;

    const order: Order = {
      id: input.clientOrderId,
      clientUid: input.clientUid,
      roomNumber: input.roomNumber,
      lines,
      note: input.note,
      totalFcfa,
      status: 'new',
      source: 'app',
      createdAt: new Date(),
    };

    orders[estId].push(order);
    return order;
  }

  watchOrders(
    estId: string,
    onNext: (orders: Order[]) => void,
  ): () => void {
    let demoCount = 0;
    const estItems = items[estId] ?? [];
    const roomNums = Object.values(roomTokens)
      .filter((r) => r.estId === estId)
      .map((r) => r.roomNumber);

    const demoInterval = setInterval(() => {
      if (!orders[estId]) orders[estId] = [];
      if (estItems.length > 0 && roomNums.length > 0) {
        demoCount++;
        const pick = estItems[demoCount % estItems.length];
        const room = roomNums[demoCount % roomNums.length];
        orders[estId].push({
          id: `demo-order-${Date.now()}`,
          clientUid: 'demo-client',
          roomNumber: room,
          lines: [{ itemId: pick.id, name: pick.name, qty: 1 + (demoCount % 3), unitPriceFcfa: pick.priceFcfa }],
          totalFcfa: pick.priceFcfa * (1 + (demoCount % 3)),
          status: 'new',
          source: 'app',
          createdAt: new Date(),
        });
      }
    }, 15000);

    const pollInterval = setInterval(() => {
      onNext([...(orders[estId] ?? [])].reverse());
    }, 2000);
    onNext([...(orders[estId] ?? [])].reverse());

    return () => {
      clearInterval(demoInterval);
      clearInterval(pollInterval);
    };
  }

  watchOrder(
    estId: string,
    orderId: string,
    onNext: (order: Order | null, hasPendingWrites: boolean) => void,
  ): () => void {
    const interval = setInterval(() => {
      const order = (orders[estId] ?? []).find((o) => o.id === orderId) ?? null;
      onNext(order, false);
    }, 3000);
    const order = (orders[estId] ?? []).find((o) => o.id === orderId) ?? null;
    onNext(order, false);
    return () => clearInterval(interval);
  }

  async updateOrderStatus(
    estId: string,
    orderId: string,
    status: OrderStatus,
  ): Promise<void> {
    const order = (orders[estId] ?? []).find((o) => o.id === orderId);
    if (!order) throw new Error('Commande introuvable');
    order.status = status;
    if (status === 'seen') order.seenAt = new Date();
    if (status === 'preparing') order.preparingAt = new Date();
    if (status === 'delivered') order.deliveredAt = new Date();
  }

  async updateItem(
    estId: string,
    itemId: string,
    data: Partial<Pick<Item, 'name' | 'priceFcfa' | 'available' | 'position'>>,
  ): Promise<void> {
    const item = (items[estId] ?? []).find((i) => i.id === itemId);
    if (!item) throw new Error('Article introuvable');
    Object.assign(item, data);
  }

  async createItem(estId: string, data: Omit<Item, 'id'>): Promise<Item> {
    const newItem: Item = { ...data, id: `item-${Date.now()}` };
    if (!items[estId]) items[estId] = [];
    items[estId].push(newItem);
    return newItem;
  }

  async deleteItem(estId: string, itemId: string): Promise<void> {
    const list = items[estId];
    if (!list) return;
    const idx = list.findIndex((i) => i.id === itemId);
    if (idx >= 0) list.splice(idx, 1);
  }

  async updateCategory(
    estId: string,
    catId: string,
    data: Partial<Pick<Category, 'name' | 'position'>>,
  ): Promise<void> {
    const cat = (categories[estId] ?? []).find((c) => c.id === catId);
    if (!cat) throw new Error('Categorie introuvable');
    Object.assign(cat, data);
  }

  async createCategory(estId: string, data: Omit<Category, 'id'>): Promise<Category> {
    const newCat: Category = { ...data, id: `cat-${Date.now()}` };
    if (!categories[estId]) categories[estId] = [];
    categories[estId].push(newCat);
    return newCat;
  }

  async deleteCategory(estId: string, catId: string): Promise<void> {
    const list = categories[estId];
    if (!list) return;
    const idx = list.findIndex((c) => c.id === catId);
    if (idx >= 0) list.splice(idx, 1);
  }
}
