import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

export function ConnectionStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <span class={`connection-status ${online ? 'online' : 'offline'}`}>
      <span class="status-dot"></span>
      {online ? 'Connecte' : 'Hors ligne'}
    </span>
  );
}
