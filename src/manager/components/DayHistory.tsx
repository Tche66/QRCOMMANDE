import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { Api } from '../../api';
import type { Order } from '../../types';
import { formatFcfa } from '../../client/order-helpers';

interface Props {
  api: Api;
  estId: string;
}

export function DayHistory({ api, estId }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDayOrders(estId).then((o) => {
      setOrders(o);
      setLoading(false);
    });
  }, [estId]);

  if (loading) {
    return <div class="loading-page"><div class="spinner"></div><p>Chargement...</p></div>;
  }

  const totalFcfa = orders.reduce((sum, o) => sum + o.totalFcfa, 0);
  const delivered = orders.filter((o) => o.status === 'delivered').length;

  return (
    <div class="day-history">
      <h2>Aujourd'hui</h2>

      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-value">{orders.length}</div>
          <div class="stat-label">Commandes</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{delivered}</div>
          <div class="stat-label">Livrees</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{formatFcfa(totalFcfa)}</div>
          <div class="stat-label">Total</div>
        </div>
      </div>

      {orders.length === 0 && <p class="no-orders">Aucune commande aujourd'hui.</p>}

      {orders.map((order) => {
        const time = order.createdAt instanceof Date
          ? order.createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          : '';
        return (
          <div key={order.id} class="history-order">
            <span class="history-room">Ch. {order.roomNumber}</span>
            <span class="history-time">{time}</span>
            <span class="history-total">{formatFcfa(order.totalFcfa)}</span>
            <span class={`history-status status-${order.status}`}>{order.status}</span>
          </div>
        );
      })}
    </div>
  );
}
