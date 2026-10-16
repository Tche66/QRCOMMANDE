import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { Api } from '../../api';
import type { Establishment } from '../../types';

interface Props {
  api: Api;
}

export function EstablishmentList({ api }: Props) {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const list = await api.listEstablishments();
    setEstablishments(list);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleStatus(est: Establishment) {
    const newStatus = est.status === 'suspended' ? 'active' : 'suspended';
    if (!confirm(`${newStatus === 'suspended' ? 'Suspendre' : 'Reactiver'} "${est.name}" ?`)) return;
    await api.updateEstablishment(est.id, { status: newStatus });
    await load();
  }

  if (loading) {
    return <div class="loading-page"><div class="spinner"></div><p>Chargement...</p></div>;
  }

  return (
    <div class="est-list">
      <h2>Etablissements ({establishments.length})</h2>

      {establishments.length === 0 && <p>Aucun etablissement.</p>}

      {establishments.map((est) => (
        <div key={est.id} class="est-card">
          <div class="est-card-info">
            <div class="est-name">{est.name}</div>
            <div class="est-details">
              {est.city && <span>{est.city}</span>}
              {' · '}
              <span class={`est-status est-${est.status}`}>{est.status}</span>
            </div>
            <div class="est-slug">/{est.slug}</div>
          </div>
          <div class="est-card-actions">
            <button
              class={`btn btn-small ${est.status === 'suspended' ? 'btn-confirm' : 'btn-suspend'}`}
              onClick={() => toggleStatus(est)}
            >
              {est.status === 'suspended' ? 'Reactiver' : 'Suspendre'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
