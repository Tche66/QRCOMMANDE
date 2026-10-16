import { h } from 'preact';
import { useState } from 'preact/hooks';
import type { Category, Item } from '../../types';
import { ItemRow } from './ItemRow';

interface Props {
  category: Category;
  items: Item[];
  onUpdateCategory: (catId: string, data: Partial<Category>) => void;
  onDeleteCategory: (catId: string) => void;
  onUpdateItem: (itemId: string, data: Partial<Item>) => void;
  onDeleteItem: (itemId: string) => void;
  onAddItem: (catId: string, name: string, price: number) => void;
}

export function CategorySection({
  category, items, onUpdateCategory, onDeleteCategory,
  onUpdateItem, onDeleteItem, onAddItem,
}: Props) {
  const [editingName, setEditingName] = useState(false);
  const [catName, setCatName] = useState(category.name);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  function saveCatName() {
    if (catName.trim() && catName.trim() !== category.name) {
      onUpdateCategory(category.id, { name: catName.trim() });
    }
    setEditingName(false);
  }

  function handleAddItem() {
    const price = parseInt(newPrice, 10);
    if (newName.trim() && !isNaN(price) && price >= 0) {
      onAddItem(category.id, newName.trim(), price);
      setNewName('');
      setNewPrice('');
      setAdding(false);
    }
  }

  const sortedItems = [...items].sort((a, b) => a.position - b.position);

  return (
    <div class="cat-section">
      <div class="cat-header">
        {editingName ? (
          <input
            class="edit-input cat-name-input"
            value={catName}
            onInput={(e) => setCatName((e.target as HTMLInputElement).value)}
            onBlur={saveCatName}
            onKeyDown={(e) => e.key === 'Enter' && saveCatName()}
            autoFocus
          />
        ) : (
          <h3 class="cat-name" onClick={() => setEditingName(true)}>{category.name}</h3>
        )}
        <button class="btn-delete-small" onClick={() => {
          if (items.length > 0) {
            if (!confirm(`Supprimer "${category.name}" et ses ${items.length} articles ?`)) return;
          }
          onDeleteCategory(category.id);
        }}>✕</button>
      </div>

      {sortedItems.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          onUpdate={onUpdateItem}
          onDelete={(id) => {
            if (confirm(`Supprimer "${item.name}" ?`)) onDeleteItem(id);
          }}
        />
      ))}

      {adding ? (
        <div class="add-item-form">
          <input
            class="edit-input"
            placeholder="Nom de l'article"
            value={newName}
            onInput={(e) => setNewName((e.target as HTMLInputElement).value)}
            autoFocus
          />
          <input
            class="edit-input edit-price"
            type="number"
            min="0"
            placeholder="Prix FCFA"
            value={newPrice}
            onInput={(e) => setNewPrice((e.target as HTMLInputElement).value)}
          />
          <div class="add-item-buttons">
            <button class="btn btn-small btn-confirm" onClick={handleAddItem}>Ajouter</button>
            <button class="btn btn-small btn-cancel" onClick={() => setAdding(false)}>Annuler</button>
          </div>
        </div>
      ) : (
        <button class="btn-add-item" onClick={() => setAdding(true)}>+ Ajouter un article</button>
      )}
    </div>
  );
}
