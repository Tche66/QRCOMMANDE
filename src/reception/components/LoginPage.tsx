import { h } from 'preact';
import { useState } from 'preact/hooks';
import { loginReception, type ReceptionUser } from '../auth';

interface Props {
  slug: string;
  onLogin: (user: ReceptionUser) => void;
}

export function LoginPage({ slug, onLogin }: Props) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const user = await loginReception(slug, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div class="login-page">
      <div class="login-card">
        <h1>Reception</h1>
        <p class="login-slug">{slug}</p>
        <form onSubmit={handleSubmit}>
          <div class="form-group">
            <label for="password">Code d'acces</label>
            <input
              id="password"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Code PIN"
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              autoFocus
            />
          </div>
          {error && <p class="login-error">{error}</p>}
          <button type="submit" class="btn btn-login" disabled={loading || !password}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
