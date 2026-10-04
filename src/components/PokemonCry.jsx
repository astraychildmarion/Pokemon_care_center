import { useEffect, useRef, useState } from 'react';

export default function PokemonCry({ cry }) {
  const audioRef = useRef(null);
  const activeRef = useRef(true);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    activeRef.current = true;
    const audio = audioRef.current;
    return () => {
      activeRef.current = false;
      audio?.pause();
    };
  }, []);

  async function playCry() {
    setStatus('loading');
    try {
      await audioRef.current.play();
      if (activeRef.current) setStatus('playing');
    } catch {
      if (activeRef.current) setStatus('error');
    }
  }

  return (
    <div className="pokemon-cry">
      {cry && (
        <audio
          ref={audioRef}
          src={cry}
          preload="none"
          onEnded={() => setStatus('idle')}
          onError={() => setStatus('error')}
        />
      )}
      <button
        className="cry-button"
        type="button"
        disabled={!cry || status === 'loading' || status === 'playing'}
        onClick={playCry}
      >Play Cry</button>
      {!cry && <p>No cry available for this Pokémon.</p>}
      {status === 'loading' && <p role="status">Loading cry…</p>}
      {status === 'playing' && <p role="status">Playing cry…</p>}
      {status === 'error' && <p role="status">Couldn’t play this cry. Please try again.</p>}
    </div>
  );
}
