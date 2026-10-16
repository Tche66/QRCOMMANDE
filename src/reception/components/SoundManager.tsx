import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

interface Props {
  hasNewOrders: boolean;
}

function playBeep(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 800;
  gain.gain.value = 0.5;
  osc.start();
  osc.stop(ctx.currentTime + 0.25);
}

export function SoundManager({ hasNewOrders }: Props) {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function enableSound() {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    playBeep(ctxRef.current);
    setEnabled(true);
  }

  useEffect(() => {
    if (!enabled || !ctxRef.current) return;

    if (hasNewOrders) {
      playBeep(ctxRef.current);
      intervalRef.current = setInterval(() => {
        if (ctxRef.current && ctxRef.current.state === 'running') {
          playBeep(ctxRef.current);
        }
      }, 3000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, hasNewOrders]);

  return (
    <button
      class={`btn-sound ${enabled ? (hasNewOrders ? 'sound-ringing' : 'sound-on') : 'sound-off'}`}
      onClick={enableSound}
    >
      {!enabled ? '🔇 Activer le son' : hasNewOrders ? '🔔 Sonnerie active' : '🔊 Son active'}
    </button>
  );
}
