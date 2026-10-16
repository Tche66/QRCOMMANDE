import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { Api } from '../api';
import type { Establishment } from '../types';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { logoutReception, type ReceptionUser } from './auth';

interface Props {
  api: Api;
  slug: string;
}

type View = 'login' | 'loading' | 'dashboard' | 'error';

export function ReceptionApp({ api, slug }: Props) {
  const [view, setView] = useState<View>('login');
  const [user, setUser] = useState<ReceptionUser | null>(null);
  const [estId, setEstId] = useState('');
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [error, setError] = useState('');

  async function handleLogin(loggedUser: ReceptionUser) {
    setUser(loggedUser);
    setView('loading');

    try {
      const slugId = await api.resolveSlug(slug);
      if (!slugId) {
        setError('Etablissement introuvable.');
        setView('error');
        return;
      }

      setEstId(slugId);
      const est = await api.getEstablishment(slugId);
      if (!est) {
        setError('Etablissement introuvable.');
        setView('error');
        return;
      }

      setEstablishment(est);
      setView('dashboard');
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement');
      setView('error');
    }
  }

  async function handleLogout() {
    await logoutReception();
    setUser(null);
    setEstablishment(null);
    setView('login');
  }

  if (view === 'login') {
    return <LoginPage slug={slug} onLogin={handleLogin} />;
  }

  if (view === 'loading') {
    return (
      <div class="loading-page">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
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

  if (view === 'dashboard' && establishment) {
    return (
      <Dashboard
        api={api}
        estId={estId}
        establishment={establishment}
        onLogout={handleLogout}
      />
    );
  }

  return null;
}
