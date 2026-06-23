// CAPA 3 · Interfaz — Estado React del reproductor de paisajes sonoros.
import { useEffect, useRef, useState } from 'react';
import { SoundscapePlayer } from '../audio/soundscapes';

export function useSoundscape() {
  const ref = useRef<SoundscapePlayer | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(0.6);
  const [sleepMin, setSleepMin] = useState(0);

  const player = (): SoundscapePlayer => (ref.current ??= new SoundscapePlayer());

  useEffect(() => () => ref.current?.dispose(), []);

  function toggle(id: string) {
    const p = player();
    if (current === id) {
      p.stop();
      setCurrent(null);
      setSleepMin(0);
    } else {
      p.play(id);
      setCurrent(id);
    }
  }

  function setVolume(v: number) {
    player().setVolume(v);
    setVolumeState(v);
  }

  function startSleepTimer(min: number) {
    player().setSleepTimer(min, () => {
      setCurrent(null);
      setSleepMin(0);
    });
    setSleepMin(min);
  }

  function cancelSleepTimer() {
    player().cancelSleepTimer();
    setSleepMin(0);
  }

  return {
    current,
    volume,
    sleepMin,
    supported: player().isSupported,
    toggle,
    setVolume,
    startSleepTimer,
    cancelSleepTimer,
  };
}
