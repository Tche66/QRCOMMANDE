export type OrderStatus = 'new' | 'seen' | 'preparing' | 'delivered';
export type UserRole = 'super_admin' | 'manager' | 'reception';
export type EstablishmentStatus = 'trial' | 'active' | 'suspended';

export interface Establishment {
  id: string;
  slug: string;
  name: string;
  city?: string;
  type?: string;
  theme?: { color?: string };
  receptionPhone?: string;
  managerPhone?: string;
  status: EstablishmentStatus;
  createdAt: Date;
}

export interface Room {
  id: string;
  number: string;
  qrToken: string;
}

export interface Category {
  id: string;
  name: string;
  position: number;
}

export interface Item {
  id: string;
  categoryId: string;
  name: string;
  priceFcfa: number;
  available: boolean;
  position: number;
}

export interface OrderLine {
  itemId: string;
  name: string;
  qty: number;
  unitPriceFcfa: number;
}

export interface Order {
  id: string;
  clientUid: string;
  roomNumber: string;
  lines: OrderLine[];
  note?: string;
  totalFcfa: number;
  status: OrderStatus;
  source: 'app' | 'sms';
  createdAt: Date;
  seenAt?: Date;
  preparingAt?: Date;
  deliveredAt?: Date;
}

export interface CreateOrderInput {
  clientOrderId: string;
  clientUid: string;
  roomNumber: string;
  lines: { itemId: string; qty: number }[];
  note?: string;
}

export interface Menu {
  categories: Category[];
  items: Item[];
}

export interface SlugDoc {
  estId: string;
}

export interface RoomTokenDoc {
  estId: string;
  roomNumber: string;
}
