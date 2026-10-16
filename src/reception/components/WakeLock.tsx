import { useEffect, useRef } from 'preact/hooks';

export function useWakeLock() {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  async function requestLock() {
    try {
      if ('wakeLock' in navigator) {
        lockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch (_) {}
  }

  useEffect(() => {
    requestLock();

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        requestLock();
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (lockRef.current) {
        lockRef.current.release();
      }
    };
  }, []);
}
