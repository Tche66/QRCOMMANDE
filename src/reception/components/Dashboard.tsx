import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { Api } from '../../api';
import type { Establishment, Order, OrderStatus, Item } from '../../types';
import { OrderCard } from './OrderCard';
import { SoundManager } from './SoundManager';
import { ConnectionStatus } from './ConnectionStatus';
import { useWakeLock } from './WakeLock';

interface Props {
  api: Api;
  estId: string;
  establishment: Establishment;
  onLogout: () => void;
}

export function Dashboard({ api, estId, establishment, onLogout }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useWakeLock();

  useEffect(() => {
    api.getMenu(estId).then((menu) => {
      setMenuItems(menu.items);
    });

    const unsub = api.watchOrders(estId, (newOrders) => {
      setOrders(newOrders);
      setLoading(false);
    }, (err) => {
      console.error('Watch orders error:', err);
    });

    return unsub;
  }, [api, estId]);

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    try {
      await api.updateOrderStatus(estId, orderId, status);
    } catch (err: any) {
      console.error('Status update error:', err);
      alert('Erreur : ' + (err.message || 'Impossible de changer le statut'));
    }
  }

  const hasNewOrders = orders.some((o) => o.status === 'new');

  const activeOrders = orders.filter((o) => o.status !== 'delivered');
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');

  return (
    <div class="dashboard">
      <header class="dashboard-header">
        <div class="dashboard-header-left">
          <h1>{establishment.name}</h1>
          <ConnectionStatus />
        </div>
        <div class="dashboard-header-right">
          <SoundManager hasNewOrders={hasNewOrders} />
          <button class="btn-logout" onClick={onLogout}>Deconnexion</button>
        </div>
      </header>

      {loading && (
        <div class="dashboard-loading">
          <p>Chargement des commandes...</p>
        </div>
      )}

      {!loading && activeOrders.length === 0 && deliveredOrders.length === 0 && (
        <div class="dashboard-empty">
          <p>Aucune commande aujourd'hui.</p>
          <p class="dashboard-empty-sub">Les nouvelles commandes apparaitront ici automatiquement.</p>
        </div>
      )}

      {activeOrders.length > 0 && (
        <div class="orders-section">
          <h2 class="section-title">Commandes en cours ({activeOrders.length})</h2>
          <div class="orders-grid">
            {activeOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                menuItems={menuItems}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      )}

      {deliveredOrders.length > 0 && (
        <div class="orders-section delivered-section">
          <h2 class="section-title">Livrees ({deliveredOrders.length})</h2>
          <div class="orders-grid">
            {deliveredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                menuItems={menuItems}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
