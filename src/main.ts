import { getApi } from './api';

const mode = import.meta.env.VITE_API_MODE || 'demo';

async function init() {
  const api = await getApi(mode as 'demo' | 'firebase');
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `
      <h1>Commande QR</h1>
      <p>Mode : <strong>${mode}</strong></p>
      <p>Le socle est en place. Les fonctionnalites arrivent aux prochaines etapes.</p>
    `;
  }
}

init();
