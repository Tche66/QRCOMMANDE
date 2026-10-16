import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { Api } from '../../api';
import type { Order, OrderStatus as Status } from '../../types';
import { SmsButton } from './SmsButton';

interface Props {
  api: Api;
  estId: string;
  orderId: string;
  receptionPhone: string;
  roomNumber: string;
  cartItems: { name: string; qty: number }[];
  onNewOrder: () => void;
}

const STATUS_LABELS: Record<Status, string> = {
  new: 'Commande recue par la reception',
  seen: 'Prise en charge par la reception',
  preparing: 'En cours de preparation',
  delivered: 'Livree !',
};

const STATUS_ICONS: Record<Status, string> = {
  new: '📨',
  seen: '👁',
  preparing: '🍳',
  delivered: '✅',
};

export function OrderStatusPage({ api, estId, orderId, receptionPhone, roomNumber, cartItems, onNewOrder }: Props) {
  const [order, setOrder] = useState<Order | null>(null);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    const unsub = api.watchOrder(estId, orderId, (o, hasPendingWrites) => {
      setOrder(o);
      setPending(hasPendingWrites);
    });
    return unsub;
  }, [api, estId, orderId]);

  return (
    <div class="order-status-page">
      {pending && (
        <div class="status-pending">
          <div class="status-icon">⏳</div>
          <h2>Commande non encore envoyee</h2>
          <p>En attente de connexion au serveur...</p>
          <SmsButton phone={receptionPhone} roomNumber={roomNumber} items={cartItems} />
        </div>
      )}

      {!pending && order && (
        <div class="status-confirmed">
          <div class="status-icon">{STATUS_ICONS[order.status]}</div>
          <h2>{STATUS_LABELS[order.status]}</h2>
          <div class="order-summary">
            <p><strong>Chambre {order.roomNumber}</strong></p>
            {order.lines.map((line, i) => (
              <div key={i} class="order-line-small">
                {line.qty}x {line.name}
              </div>
            ))}
            <p class="order-total"><strong>{order.totalFcfa.toLocaleString('fr-FR')} FCFA</strong></p>
          </div>
          {order.status === 'delivered' && (
            <button class="btn btn-primary" onClick={onNewOrder} style={{ marginTop: '20px' }}>
              Nouvelle commande
            </button>
          )}
        </div>
      )}

      {!pending && !order && (
        <div class="status-error">
          <h2>Commande introuvable</h2>
          <button class="btn btn-primary" onClick={onNewOrder}>
            Retour au menu
          </button>
        </div>
      )}
    </div>
  );
}
