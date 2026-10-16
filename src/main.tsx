import { h, render } from 'preact';
import { getApi } from './api';
import { ClientApp } from './client/ClientApp';
import './client/styles.css';
import './reception/styles.css';

interface ClientRoute { type: 'client'; slug: string; token: string }
interface ReceptionRoute { type: 'reception'; slug: string }
interface HomeRoute { type: 'home' }

type Route = ClientRoute | ReceptionRoute | HomeRoute;

function parseRoute(): Route {
  const path = window.location.pathname;

  const receptionMatch = path.match(/^\/([^/]+)\/reception\/?$/);
  if (receptionMatch) return { type: 'reception', slug: receptionMatch[1] };

  const clientMatch = path.match(/^\/([^/]+)\/r\/([^/]+)/);
  if (clientMatch) return { type: 'client', slug: clientMatch[1], token: clientMatch[2] };

  return { type: 'home' };
}

function HomePage() {
  return (
    <div class="home-page">
      <h1>Commande QR</h1>
      <p>Scannez le QR code dans votre chambre pour commander.</p>
      <p style={{ fontSize: '14px', color: '#999' }}>
        Ce service est reserve aux clients des etablissements partenaires.
      </p>
    </div>
  );
}

async function main() {
  const route = parseRoute();
  const app = document.getElementById('app');
  if (!app) return;

  if (route.type === 'home') {
    render(<HomePage />, app);
    return;
  }

  const api = await getApi();

  if (route.type === 'reception') {
    const { ReceptionApp } = await import('./reception/ReceptionApp');
    render(<ReceptionApp api={api} slug={route.slug} />, app);
    return;
  }

  render(<ClientApp api={api} slug={route.slug} token={route.token} />, app);
}

main();
