import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { Api } from '../../api';
import type { Menu, Category, Item } from '../../types';
import { CategorySection } from './CategorySection';

interface Props {
  api: Api;
  estId: string;
}

export function MenuEditor({ api, estId }: Props) {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  async function loadMenu() {
    const m = await api.getMenu(estId);
    setMenu(m);
  }

  useEffect(() => { loadMenu(); }, [estId]);

  async function handleUpdateItem(itemId: string, data: Partial<Item>) {
    await api.updateItem(estId, itemId, data);
    await loadMenu();
  }

  async function handleDeleteItem(itemId: string) {
    await api.deleteItem(estId, itemId);
    await loadMenu();
  }

  async function handleAddItem(catId: string, name: string, price: number) {
    const maxPos = (menu?.items.filter((i) => i.categoryId === catId) ?? [])
      .reduce((max, i) => Math.max(max, i.position), -1);
    await api.createItem(estId, {
      categoryId: catId,
      name,
      priceFcfa: price,
      available: true,
      position: maxPos + 1,
    });
    await loadMenu();
  }

  async function handleUpdateCategory(catId: string, data: Partial<Category>) {
    await api.updateCategory(estId, catId, data);
    await loadMenu();
  }

  async function handleDeleteCategory(catId: string) {
    const catItems = menu?.items.filter((i) => i.categoryId === catId) ?? [];
    for (const item of catItems) {
      await api.deleteItem(estId, item.id);
    }
    await api.deleteCategory(estId, catId);
    await loadMenu();
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return;
    const maxPos = (menu?.categories ?? []).reduce((max, c) => Math.max(max, c.position), -1);
    await api.createCategory(estId, { name: newCatName.trim(), position: maxPos + 1 });
    setNewCatName('');
    setAddingCat(false);
    await loadMenu();
  }

  if (!menu) {
    return <div class="loading-page"><div class="spinner"></div><p>Chargement du menu...</p></div>;
  }

  const sortedCats = [...menu.categories].sort((a, b) => a.position - b.position);

  return (
    <div class="menu-editor">
      {sortedCats.map((cat) => (
        <CategorySection
          key={cat.id}
          category={cat}
          items={menu.items.filter((i) => i.categoryId === cat.id)}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onAddItem={handleAddItem}
        />
      ))}

      {addingCat ? (
        <div class="add-cat-form">
          <input
            class="edit-input"
            placeholder="Nom de la categorie"
            value={newCatName}
            onInput={(e) => setNewCatName((e.target as HTMLInputElement).value)}
            autoFocus
          />
          <div class="add-item-buttons">
            <button class="btn btn-small btn-confirm" onClick={handleAddCategory}>Creer</button>
            <button class="btn btn-small btn-cancel" onClick={() => setAddingCat(false)}>Annuler</button>
          </div>
        </div>
      ) : (
        <button class="btn-add-cat" onClick={() => setAddingCat(true)}>+ Ajouter une categorie</button>
      )}
    </div>
  );
}
