import { h } from 'preact';
import { useState } from 'preact/hooks';
import type { Api } from '../api';
import type { Establishment } from '../types';
import { ManagerLoginPage } from './components/LoginPage';
import { MenuEditor } from './components/MenuEditor';
import { SettingsPage } from './components/SettingsPage';
import { DayHistory } from './components/DayHistory';
import { logoutManager, type ManagerUser } from './auth';

interface Props {
  api: Api;
  slug: string;
}

type View = 'login' | 'loading' | 'menu' | 'settings' | 'history' | 'error';
type Tab = 'menu' | 'settings' | 'history';

export function ManagerApp({ api, slug }: Props) {
  const [view, setView] = useState<View>('login');
  const [tab, setTab] = useState<Tab>('menu');
  const [estId, setEstId] = useState('');
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [error, setError] = useState('');

  async function handleLogin(user: ManagerUser) {
    setView('loading');
    try {
      const slugId = await api.resolveSlug(slug);
      if (!slugId) { setError('Etablissement introuvable.'); setView('error'); return; }
      setEstId(slugId);
      const est = await api.getEstablishment(slugId);
      if (!est) { setError('Etablissement introuvable.'); setView('error'); return; }
      setEstablishment(est);
      setView('menu');
    } catch (err: any) {
      setError(err.message || 'Erreur');
      setView('error');
    }
  }

  async function handleLogout() {
    await logoutManager();
    setView('login');
  }

  async function refreshEstablishment() {
    if (!estId) return;
    const est = await api.getEstablishment(estId);
    if (est) setEstablishment(est);
  }

  if (view === 'login') return <ManagerLoginPage slug={slug} onLogin={handleLogin} />;

  if (view === 'loading') {
    return <div class="loading-page"><div class="spinner"></div><p>Chargement...</p></div>;
  }

  if (view === 'error') {
    return (
      <div class="error-page">
        <h2>Erreur</h2>
        <p>{error}</p>
        <button class="btn btn-primary" onClick={handleLogout}>Retour</button>
      </div>
    );
  }

  return (
    <div class="manager-app">
      <header class="manager-header">
        <h1>{establishment?.name || slug}</h1>
        <button class="btn-logout" onClick={handleLogout}>Deconnexion</button>
      </header>

      <nav class="manager-tabs">
        <button class={`tab ${tab === 'menu' ? 'active' : ''}`} onClick={() => setTab('menu')}>Menu</button>
        <button class={`tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>Parametres</button>
        <button class={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Historique</button>
      </nav>

      <div class="manager-content">
        {tab === 'menu' && <MenuEditor api={api} estId={estId} />}
        {tab === 'settings' && establishment && (
          <SettingsPage api={api} estId={estId} establishment={establishment} onUpdated={refreshEstablishment} />
        )}
        {tab === 'history' && <DayHistory api={api} estId={estId} />}
      </div>
    </div>
  );
}
