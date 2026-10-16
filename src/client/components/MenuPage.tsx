import { h } from 'preact';
import { useState } from 'preact/hooks';
import type { Menu, Item, Category } from '../../types';
import { formatFcfa } from '../order-helpers';

interface CartItem {
  item: Item;
  qty: number;
}

interface Props {
  menu: Menu;
  onOrder: (lines: { itemId: string; qty: number; name: string }[], note: string) => void;
  loading: boolean;
  color?: string;
}

export function MenuPage({ menu, onOrder, loading, color }: Props) {
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [note, setNote] = useState('');
  const [showCart, setShowCart] = useState(false);

  const accentColor = color || '#1a7a5a';

  function addItem(item: Item) {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(item.id);
      if (existing) {
        next.set(item.id, { ...existing, qty: existing.qty + 1 });
      } else {
        next.set(item.id, { item, qty: 1 });
      }
      return next;
    });
  }

  function removeItem(itemId: string) {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(itemId);
      if (existing && existing.qty > 1) {
        next.set(itemId, { ...existing, qty: existing.qty - 1 });
      } else {
        next.delete(itemId);
      }
      return next;
    });
  }

  const cartItems = Array.from(cart.values());
  const totalQty = cartItems.reduce((s, c) => s + c.qty, 0);
  const totalFcfa = cartItems.reduce((s, c) => s + c.qty * c.item.priceFcfa, 0);

  function handleOrder() {
    const lines = cartItems.map((c) => ({
      itemId: c.item.id,
      qty: c.qty,
      name: c.item.name,
    }));
    onOrder(lines, note);
  }

  const sortedCategories = [...menu.categories].sort((a, b) => a.position - b.position);

  function itemsForCategory(cat: Category): Item[] {
    return menu.items
      .filter((i) => i.categoryId === cat.id)
      .sort((a, b) => a.position - b.position);
  }

  return (
    <div class="menu-page">
      {sortedCategories.map((cat) => (
        <div key={cat.id} class="menu-category">
          <h2 class="category-title" style={{ borderBottomColor: accentColor }}>{cat.name}</h2>
          <div class="menu-items">
            {itemsForCategory(cat).map((item) => {
              const inCart = cart.get(item.id);
              return (
                <div key={item.id} class={`menu-item ${!item.available ? 'unavailable' : ''}`}>
                  <div class="item-info">
                    <div class="item-name">{item.name}</div>
                    <div class="item-price">{formatFcfa(item.priceFcfa)}</div>
                    {!item.available && <div class="item-unavailable">Indisponible</div>}
                  </div>
                  {item.available && (
                    <div class="item-actions">
                      {inCart ? (
                        <div class="qty-controls">
                          <button class="btn-qty" onClick={() => removeItem(item.id)}>−</button>
                          <span class="qty-value">{inCart.qty}</span>
                          <button class="btn-qty" onClick={() => addItem(item)}>+</button>
                        </div>
                      ) : (
                        <button
                          class="btn-add"
                          style={{ backgroundColor: accentColor }}
                          onClick={() => addItem(item)}
                        >
                          Ajouter
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {totalQty > 0 && (
        <div class="cart-bar" style={{ backgroundColor: accentColor }} onClick={() => setShowCart(true)}>
          <span class="cart-count">{totalQty} article{totalQty > 1 ? 's' : ''}</span>
          <span class="cart-total">{formatFcfa(totalFcfa)}</span>
          <span class="cart-action">Voir le panier</span>
        </div>
      )}

      {showCart && (
        <div class="cart-overlay" onClick={() => setShowCart(false)}>
          <div class="cart-panel" onClick={(e) => e.stopPropagation()}>
            <h2>Votre commande</h2>
            {cartItems.map((c) => (
              <div key={c.item.id} class="cart-line">
                <div class="cart-line-info">
                  <span>{c.item.name}</span>
                  <span class="cart-line-price">{formatFcfa(c.qty * c.item.priceFcfa)}</span>
                </div>
                <div class="qty-controls">
                  <button class="btn-qty" onClick={() => removeItem(c.item.id)}>−</button>
                  <span class="qty-value">{c.qty}</span>
                  <button class="btn-qty" onClick={() => addItem(c.item)}>+</button>
                </div>
              </div>
            ))}
            <div class="cart-note">
              <label for="note">Note (optionnel)</label>
              <input
                id="note"
                type="text"
                placeholder="Ex : sans piment, bien frais..."
                value={note}
                onInput={(e) => setNote((e.target as HTMLInputElement).value)}
              />
            </div>
            <div class="cart-total-line">
              <strong>Total</strong>
              <strong>{formatFcfa(totalFcfa)}</strong>
            </div>
            <button
              class="btn btn-primary btn-order"
              style={{ backgroundColor: accentColor }}
              onClick={handleOrder}
              disabled={loading}
            >
              {loading ? 'Envoi en cours...' : 'Commander'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
