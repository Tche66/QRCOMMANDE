import { h } from 'preact';
import { useState } from 'preact/hooks';
import type { Item } from '../../types';
import { formatFcfa } from '../../client/order-helpers';

interface Props {
  item: Item;
  onUpdate: (itemId: string, data: Partial<Item>) => void;
  onDelete: (itemId: string) => void;
}

export function ItemRow({ item, onUpdate, onDelete }: Props) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [price, setPrice] = useState(String(item.priceFcfa));
  const [name, setName] = useState(item.name);

  function savePrice() {
    const val = parseInt(price, 10);
    if (!isNaN(val) && val >= 0) {
      onUpdate(item.id, { priceFcfa: val });
    }
    setEditingPrice(false);
  }

  function saveName() {
    if (name.trim()) {
      onUpdate(item.id, { name: name.trim() });
    }
    setEditingName(false);
  }

  return (
    <div class={`item-row ${!item.available ? 'item-disabled' : ''}`}>
      <div class="item-row-main">
        {editingName ? (
          <input
            class="edit-input"
            value={name}
            onInput={(e) => setName((e.target as HTMLInputElement).value)}
            onBlur={saveName}
            onKeyDown={(e) => e.key === 'Enter' && saveName()}
            autoFocus
          />
        ) : (
          <span class="item-row-name" onClick={() => setEditingName(true)}>{item.name}</span>
        )}

        {editingPrice ? (
          <div class="edit-price-wrap">
            <input
              class="edit-input edit-price"
              type="number"
              min="0"
              value={price}
              onInput={(e) => setPrice((e.target as HTMLInputElement).value)}
              onBlur={savePrice}
              onKeyDown={(e) => e.key === 'Enter' && savePrice()}
              autoFocus
            />
            <span>FCFA</span>
          </div>
        ) : (
          <span class="item-row-price" onClick={() => setEditingPrice(true)}>
            {formatFcfa(item.priceFcfa)}
          </span>
        )}
      </div>

      <div class="item-row-actions">
        <button
          class={`btn-toggle ${item.available ? 'toggle-on' : 'toggle-off'}`}
          onClick={() => onUpdate(item.id, { available: !item.available })}
        >
          {item.available ? 'Dispo' : 'Masque'}
        </button>
        <button class="btn-delete-small" onClick={() => onDelete(item.id)}>✕</button>
      </div>
    </div>
  );
}
