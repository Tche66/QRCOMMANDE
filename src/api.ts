import type {
  Establishment,
  Menu,
  Order,
  CreateOrderInput,
  OrderStatus,
  Item,
  Category,
  RoomTokenDoc,
} from './types';

export interface Api {
  resolveSlug(slug: string): Promise<string | null>;
  resolveRoomToken(token: string): Promise<RoomTokenDoc | null>;
  getEstablishment(estId: string): Promise<Establishment | null>;
  getMenu(estId: string): Promise<Menu>;

  createOrder(estId: string, input: CreateOrderInput): Promise<Order>;
  watchOrders(
    estId: string,
    onNext: (orders: Order[]) => void,
    onError?: (err: Error) => void,
  ): () => void;
  watchOrder(
    estId: string,
    orderId: string,
    onNext: (order: Order | null, hasPendingWrites: boolean) => void,
  ): () => void;
  updateOrderStatus(
    estId: string,
    orderId: string,
    status: OrderStatus,
  ): Promise<void>;

  updateItem(
    estId: string,
    itemId: string,
    data: Partial<Pick<Item, 'name' | 'priceFcfa' | 'available' | 'position'>>,
  ): Promise<void>;
  createItem(
    estId: string,
    data: Omit<Item, 'id'>,
  ): Promise<Item>;
  deleteItem(estId: string, itemId: string): Promise<void>;

  updateCategory(
    estId: string,
    catId: string,
    data: Partial<Pick<Category, 'name' | 'position'>>,
  ): Promise<void>;
  createCategory(
    estId: string,
    data: Omit<Category, 'id'>,
  ): Promise<Category>;
  deleteCategory(estId: string, catId: string): Promise<void>;

  updateEstablishment(
    estId: string,
    data: Partial<Pick<Establishment, 'name' | 'receptionPhone' | 'managerPhone' | 'status'>>,
  ): Promise<void>;

  listEstablishments(): Promise<Establishment[]>;

  getDayOrders(estId: string): Promise<Order[]>;
}

let currentApi: Api | null = null;

export async function getApi(mode?: 'demo' | 'firebase'): Promise<Api> {
  if (currentApi) return currentApi;

  const resolved = mode || (import.meta.env.VITE_API_MODE as string) || 'demo';

  if (resolved === 'firebase') {
    const { FirebaseAdapter } = await import('./adapters/firebase');
    currentApi = new FirebaseAdapter();
  } else {
    const { DemoAdapter } = await import('./adapters/demo');
    currentApi = new DemoAdapter();
  }

  return currentApi!;
}
