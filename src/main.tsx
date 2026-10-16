import { h, render } from 'preact';
import { getApi } from './api';
import { ClientApp } from './client/ClientApp';
import './client/styles.css';
import './reception/styles.css';
import './manager/styles.css';
import './superadmin/styles.css';

interface ClientRoute { type: 'client'; slug: string; token: string }
interface ReceptionRoute { type: 'reception'; slug: string }
interface ManagerRoute { type: 'manager'; slug: string }
interface SuperAdminRoute { type: 'superadmin' }
interface HomeRoute { type: 'home' }

type Route = ClientRoute | ReceptionRoute | ManagerRoute | SuperAdminRoute | HomeRoute;

function parseRoute(): Route {
  const path = window.location.pathname;

  if (path.match(/^\/super-admin\/?$/)) return { type: 'superadmin' };

  const managerMatch = path.match(/^\/([^/]+)\/admin\/?$/);
  if (managerMatch) return { type: 'manager', slug: managerMatch[1] };

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

  if (route.type === 'superadmin') {
    const { SuperAdminApp } = await import('./superadmin/SuperAdminApp');
    render(<SuperAdminApp api={api} />, app);
    return;
  }

  if (route.type === 'manager') {
    const { ManagerApp } = await import('./manager/ManagerApp');
    render(<ManagerApp api={api} slug={route.slug} />, app);
    return;
  }

  if (route.type === 'reception') {
    const { ReceptionApp } = await import('./reception/ReceptionApp');
    render(<ReceptionApp api={api} slug={route.slug} />, app);
    return;
  }

  render(<ClientApp api={api} slug={route.slug} token={route.token} />, app);
}

main();
