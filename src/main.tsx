import { h, render } from 'preact';
import { getApi } from './api';
import { ClientApp } from './client/ClientApp';
import './client/styles.css';

function parseRoute(): { slug: string; token: string } | null {
  const path = window.location.pathname;
  const match = path.match(/^\/([^/]+)\/r\/([^/]+)/);
  if (match) return { slug: match[1], token: match[2] };
  return null;
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

  if (!route) {
    render(<HomePage />, app);
    return;
  }

  const api = await getApi();
  render(<ClientApp api={api} slug={route.slug} token={route.token} />, app);
}

main();
