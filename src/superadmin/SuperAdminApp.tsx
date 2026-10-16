import { h } from 'preact';
import { useState } from 'preact/hooks';
import type { Api } from '../api';
import { EstablishmentList } from './components/EstablishmentList';
import { loginSuperAdmin, logoutSuperAdmin, type SuperAdminUser } from './auth';

interface Props {
  api: Api;
}

export function SuperAdminApp({ api }: Props) {
  const [user, setUser] = useState<SuperAdminUser | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: Event) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const u = await loginSuperAdmin(email, password);
      setUser(u);
    } catch (err: any) {
      setError(err.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await logoutSuperAdmin();
    setUser(null);
  }

  if (!user) {
    return (
      <div class="login-page">
        <div class="login-card">
          <h1>Super Admin</h1>
          <form onSubmit={handleLogin}>
            <div class="form-group">
              <label for="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                placeholder="admin@commande-qr.com"
                autoFocus
              />
            </div>
            <div class="form-group">
              <label for="pwd">Mot de passe</label>
              <input
                id="pwd"
                type="password"
                value={password}
                onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              />
            </div>
            {error && <p class="login-error">{error}</p>}
            <button type="submit" class="btn btn-login" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div class="superadmin-app">
      <header class="sa-header">
        <h1>Commande QR - Admin</h1>
        <button class="btn-logout" onClick={handleLogout}>Deconnexion</button>
      </header>
      <div class="sa-content">
        <EstablishmentList api={api} />
      </div>
    </div>
  );
}
