import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { Api } from '../api';
import type { Establishment, Menu } from '../types';
import { Header } from './components/Header';
import { MenuPage } from './components/MenuPage';
import { OrderStatusPage } from './components/OrderStatus';
import { SmsButton } from './components/SmsButton';
import { ensureAnonymousAuth } from './auth';
import { generateOrderId } from './order-helpers';

interface Props {
  api: Api;
  slug: string;
  token: string;
}

type View = 'loading' | 'menu' | 'order' | 'error' | 'suspended';

export function ClientApp({ api, slug, token }: Props) {
  const [view, setView] = useState<View>('loading');
  const [est, setEst] = useState<Establishment | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [roomNumber, setRoomNumber] = useState('');
  const [estId, setEstId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);
  const [lastCartItems, setLastCartItems] = useState<{ name: string; qty: number }[]>([]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    try {
      const roomDoc = await api.resolveRoomToken(token);
      if (!roomDoc) {
        setError('QR code invalide ou chambre introuvable.');
        setView('error');
        return;
      }

      setEstId(roomDoc.estId);
      setRoomNumber(roomDoc.roomNumber);

      const establishment = await api.getEstablishment(roomDoc.estId);
      if (!establishment) {
        setError('Etablissement introuvable.');
        setView('error');
        return;
      }

      setEst(establishment);

      if (establishment.status === 'suspended') {
        setView('suspended');
        return;
      }

      const m = await api.getMenu(roomDoc.estId);
      setMenu(m);
      setView('menu');
    } catch (err) {
      console.error('Init error:', err);
      setError('Impossible de charger le menu. Verifiez votre connexion.');
      setView('error');
    }
  }

  async function handleOrder(lines: { itemId: string; qty: number; name: string }[], note: string) {
    if (orderLoading) return;
    setOrderLoading(true);

    try {
      const clientUid = await ensureAnonymousAuth();
      const clientOrderId = generateOrderId();

      setLastCartItems(lines.map((l) => ({ name: l.name, qty: l.qty })));

      await api.createOrder(estId, {
        clientOrderId,
        clientUid,
        roomNumber,
        lines: lines.map((l) => ({ itemId: l.itemId, qty: l.qty })),
        note: note || undefined,
      });

      setOrderId(clientOrderId);
      setView('order');
    } catch (err: any) {
      console.error('Order error:', err);
      alert(err.message || 'Erreur lors de la commande');
    } finally {
      setOrderLoading(false);
    }
  }

  function handleNewOrder() {
    setOrderId('');
    setLastCartItems([]);
    setView('menu');
  }

  if (view === 'loading') {
    return (
      <div class="loading-page">
        <div class="spinner"></div>
        <p>Chargement du menu...</p>
      </div>
    );
  }

  if (view === 'error') {
    return (
      <div class="error-page">
        <h2>Oups</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (view === 'suspended') {
    return (
      <div class="suspended-page">
        {est && <Header estName={est.name} roomNumber={roomNumber} color={est.theme?.color} />}
        <div class="suspended-content">
          <h2>Service temporairement indisponible</h2>
          <p>La commande en ligne est momentanement suspendue.</p>
          <p>Veuillez contacter la reception directement.</p>
          {est?.receptionPhone && (
            <SmsButton phone={est.receptionPhone} roomNumber={roomNumber} items={[]} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div class="client-app">
      {est && <Header estName={est.name} roomNumber={roomNumber} color={est.theme?.color} />}

      {view === 'menu' && menu && (
        <MenuPage
          menu={menu}
          onOrder={handleOrder}
          loading={orderLoading}
          color={est?.theme?.color}
        />
      )}

      {view === 'order' && est && (
        <OrderStatusPage
          api={api}
          estId={estId}
          orderId={orderId}
          receptionPhone={est.receptionPhone || ''}
          roomNumber={roomNumber}
          cartItems={lastCartItems}
          onNewOrder={handleNewOrder}
        />
      )}
    </div>
  );
}
