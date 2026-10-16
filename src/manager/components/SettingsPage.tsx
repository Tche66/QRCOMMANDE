import { h } from 'preact';
import { useState } from 'preact/hooks';
import type { Api } from '../../api';
import type { Establishment } from '../../types';

interface Props {
  api: Api;
  estId: string;
  establishment: Establishment;
  onUpdated: () => void;
}

export function SettingsPage({ api, estId, establishment, onUpdated }: Props) {
  const [receptionPhone, setReceptionPhone] = useState(establishment.receptionPhone || '');
  const [managerPhone, setManagerPhone] = useState(establishment.managerPhone || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await api.updateEstablishment(estId, { receptionPhone, managerPhone });
      setSaved(true);
      onUpdated();
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert('Erreur : ' + (err.message || 'Impossible de sauvegarder'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div class="settings-page">
      <h2>Parametres</h2>

      <div class="setting-group">
        <label>Numero de la reception</label>
        <input
          type="tel"
          value={receptionPhone}
          onInput={(e) => setReceptionPhone((e.target as HTMLInputElement).value)}
          placeholder="+225..."
        />
      </div>

      <div class="setting-group">
        <label>Numero du gerant</label>
        <input
          type="tel"
          value={managerPhone}
          onInput={(e) => setManagerPhone((e.target as HTMLInputElement).value)}
          placeholder="+225..."
        />
      </div>

      <button class="btn btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Enregistrement...' : saved ? 'Enregistre !' : 'Enregistrer'}
      </button>
    </div>
  );
}
