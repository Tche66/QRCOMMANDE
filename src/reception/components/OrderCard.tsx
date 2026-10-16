import { h } from 'preact';
import type { Order, OrderStatus, Item } from '../../types';
import { formatFcfa } from '../../client/order-helpers';

interface Props {
  order: Order;
  menuItems: Item[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}

export function OrderCard({ order, menuItems, onStatusChange }: Props) {
  const recalcTotal = order.lines.reduce((sum, line) => {
    const currentItem = menuItems.find((i) => i.id === line.itemId);
    const unitPrice = currentItem ? currentItem.priceFcfa : line.unitPriceFcfa;
    return sum + line.qty * unitPrice;
  }, 0);

  const hasDiscrepancy = recalcTotal !== order.totalFcfa;

  const time = order.createdAt instanceof Date
    ? order.createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div class={`order-card order-${order.status}`}>
      <div class="order-card-header">
        <span class="order-room">Chambre {order.roomNumber}</span>
        <span class="order-time">{time}</span>
      </div>

      <div class="order-card-lines">
        {order.lines.map((line, i) => (
          <div key={i} class="order-card-line">
            <span>{line.qty}x {line.name}</span>
            <span class="line-price">{formatFcfa(line.qty * line.unitPriceFcfa)}</span>
          </div>
        ))}
      </div>

      {order.note && (
        <div class="order-card-note">
          <strong>Note :</strong> {order.note}
        </div>
      )}

      <div class="order-card-total">
        <span>Total</span>
        <span>{formatFcfa(order.totalFcfa)}</span>
      </div>

      {hasDiscrepancy && (
        <div class="order-card-warning">
          Prix recalcule : {formatFcfa(recalcTotal)} (ecart de {formatFcfa(Math.abs(recalcTotal - order.totalFcfa))})
        </div>
      )}

      <div class="order-card-actions">
        {order.status === 'new' && (
          <button class="btn btn-status btn-seen" onClick={() => onStatusChange(order.id, 'seen')}>
            Recu
          </button>
        )}
        {order.status === 'seen' && (
          <button class="btn btn-status btn-preparing" onClick={() => onStatusChange(order.id, 'preparing')}>
            En preparation
          </button>
        )}
        {order.status === 'preparing' && (
          <button class="btn btn-status btn-delivered" onClick={() => onStatusChange(order.id, 'delivered')}>
            Livre
          </button>
        )}
        {order.status === 'delivered' && (
          <span class="order-done">Livre</span>
        )}
      </div>
    </div>
  );
}
