import { useEffect, useRef, useState } from 'react';
import { fetchPokemonDetails } from './services/pokemonApi';
import PokemonCard from './components/PokemonCard';
import PokemonDetails from './components/PokemonDetails';
import PokemonReveal from './components/PokemonReveal';
import LobbyCareIndicator from './components/LobbyCareIndicator';
import GameSpeedControl from './components/GameSpeedControl';
import {
  applyPetEvent,
  decayPetState,
  INITIAL_PET_STATE,
  isReturnRequired,
  updatePetState,
} from './utils/petState';
import {
  addPokemonToLobby,
  getDrawablePokemonIds,
  MAX_LOBBY_SIZE,
  selectAvailablePokemonId,
} from './utils/pokemonDraw';
import { loadLobbyState, saveLobbyState } from './utils/lobbyStorage';
import { DEFAULT_GAME_SPEED, GAME_SPEEDS } from './utils/gameSpeed';

export default function App() {
  const [savedLobby] = useState(loadLobbyState);
  const [pokemon, setPokemon] = useState(savedLobby.pokemon);
  const [drawnPokemon, setDrawnPokemon] = useState(null);
  const [drawStatus, setDrawStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [petStates, setPetStates] = useState(savedLobby.petStates);
  const [returnedPokemonIds, setReturnedPokemonIds] = useState(savedLobby.returnedPokemonIds);
  const [gameSpeed, setGameSpeed] = useState(DEFAULT_GAME_SPEED);
  const returnFocusRef = useRef(null);
  const drawButtonRef = useRef(null);
  const drawInProgressRef = useRef(false);
  const lobbyFull = pokemon.length >= MAX_LOBBY_SIZE;
  const noDrawablePokemon = getDrawablePokemonIds(pokemon, returnedPokemonIds).length === 0;

  function selectPokemon(guest) {
    returnFocusRef.current = document.activeElement;
    setSelectedPokemon(guest);
  }

  function interactWithPokemon(action, pokemonId = selectedPokemon?.id) {
    if (!pokemonId) return;
    setPetStates((states) => ({
      ...states,
      [pokemonId]: updatePetState(states[pokemonId] ?? INITIAL_PET_STATE, action),
    }));
  }

  function handleRandomPetEvent(event) {
    if (!selectedPokemon) return;
    const id = selectedPokemon.id;
    setPetStates((states) => ({
      ...states,
      [id]: applyPetEvent(states[id] ?? INITIAL_PET_STATE, event),
    }));
  }

  async function drawPokemon() {
    if (lobbyFull || noDrawablePokemon || drawnPokemon || drawInProgressRef.current) return;
    const pokemonId = selectAvailablePokemonId(pokemon, returnedPokemonIds);
    if (pokemonId === null) return;

    drawInProgressRef.current = true;
    setDrawStatus('loading');
    setErrorMessage('');
    try {
      setDrawnPokemon(await fetchPokemonDetails(pokemonId));
      setDrawStatus('idle');
    } catch (error) {
      setErrorMessage(error instanceof TypeError
        ? 'We couldn’t reach PokéAPI. Check your connection and try again.'
        : error.message);
      setDrawStatus('error');
    } finally {
      drawInProgressRef.current = false;
    }
  }

  function adoptDrawnPokemon() {
    if (!drawnPokemon) return;
    setPokemon((currentPokemon) => addPokemonToLobby(currentPokemon, drawnPokemon));
    setPetStates((states) => ({
      ...states,
      [drawnPokemon.id]: states[drawnPokemon.id] ?? { ...INITIAL_PET_STATE },
    }));
    setDrawnPokemon(null);
  }

  function returnPokemon(returnedPokemon) {
    setPokemon((currentPokemon) => currentPokemon.filter(({ id }) => id !== returnedPokemon.id));
    setPetStates((states) => {
      const remainingStates = { ...states };
      delete remainingStates[returnedPokemon.id];
      return remainingStates;
    });
    returnFocusRef.current = drawButtonRef.current;
    setSelectedPokemon(null);
  }

  function permanentlyReturnPokemon(returnedPokemon) {
    setReturnedPokemonIds((ids) => (
      ids.includes(returnedPokemon.id) ? ids : [...ids, returnedPokemon.id]
    ));
    returnPokemon(returnedPokemon);
  }

  useEffect(() => {
    if (!selectedPokemon) returnFocusRef.current?.focus();
  }, [selectedPokemon]);

  useEffect(() => {
    if (pokemon.length === 0) return undefined;

    const timerId = setInterval(() => {
      setPetStates((states) => {
        const decayedStates = { ...states };
        let changed = false;
        pokemon.forEach(({ id }) => {
          const currentState = states[id] ?? INITIAL_PET_STATE;
          if (isReturnRequired(currentState)) return;
          decayedStates[id] = decayPetState(currentState);
          changed = true;
        });
        return changed ? decayedStates : states;
      });
    }, GAME_SPEEDS[gameSpeed].intervalMs);

    return () => clearInterval(timerId);
  }, [pokemon, gameSpeed]);

  useEffect(() => {
    saveLobbyState({ pokemon, petStates, returnedPokemonIds });
  }, [pokemon, petStates, returnedPokemonIds]);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="site-header">
        <div className="page-width header-inner">
          <a className="brand" href="#main-content">
            <span className="pokeball brand-mark" aria-hidden="true" />
            <span>Pokémon <span className="brand-subtitle">Virtual Lobby</span></span>
          </a>
          <div className="header-status">
            <span className="project-label">Draw, adopt, and care</span>
            <LobbyCareIndicator pokemon={pokemon} petStates={petStates} />
          </div>
        </div>
      </header>

      <main id="main-content" className="page-width" tabIndex={-1}>
        {selectedPokemon && (
          <PokemonDetails
            pokemon={selectedPokemon}
            onBack={() => setSelectedPokemon(null)}
            pet={petStates[selectedPokemon.id] ?? INITIAL_PET_STATE}
            onInteract={interactWithPokemon}
            onRandomEvent={handleRandomPetEvent}
            onReturn={returnPokemon}
            onPermanentReturn={permanentlyReturnPokemon}
          />
        )}
        <div hidden={selectedPokemon !== null}>
          <div className="welcome compact-welcome">
            <div>
              <p className="eyebrow"><span aria-hidden="true">✦</span> Welcome back, trainer</p>
              <h1>Your friends are waiting.</h1>
              <p className="welcome-description">A gentle place to meet, adopt, and care for Pokémon one day at a time.</p>
            </div>
            <a className="lobby-link" href="#pokemon-lobby">Enter the lobby <span aria-hidden="true">↓</span></a>
          </div>

          <section id="pokemon-lobby" className="lobby" aria-label="Pokémon Lobby">
            <div className="section-heading">
              <div>
                <p className="eyebrow">The care room</p>
                <h2 id="lobby-title">Your Pokémon lobby</h2>
              </div>
              <span className="preview-label"><span className="sr-only">{pokemon.length} / {MAX_LOBBY_SIZE} Pokémon</span><strong>{pokemon.length}</strong> / {MAX_LOBBY_SIZE} staying here</span>
            </div>
            <p className="lobby-description">Check in with each friend, then give them what they need to feel their best.</p>

            <div className="lobby-tools">
              <div className="meet-station">
                <span className="station-ball pokeball" aria-hidden="true" />
                <div>
                  <p className="station-kicker">Adoption station</p>
                  <h3>Meet a new friend</h3>
                  <p>There is always room for a little wonder.</p>
                </div>
                <button
                  ref={drawButtonRef}
                  className="lobby-button draw-button"
                  type="button"
                  aria-label="Draw Pokémon"
                  disabled={lobbyFull || noDrawablePokemon || drawStatus === 'loading' || Boolean(drawnPokemon)}
                  onClick={drawPokemon}
                >
                  <span className="sr-only">{drawStatus === 'loading' ? 'Drawing Pokémon…' : 'Draw Pokémon'}</span>
                  <span aria-hidden="true">{drawStatus === 'loading' ? 'Looking around…' : 'See who arrives'}</span>
                </button>
              </div>
              <GameSpeedControl value={gameSpeed} onChange={setGameSpeed} />
              {lobbyFull && <p className="tool-status" role="status">Your lobby is full. Return a Pokémon to make space.</p>}
              {!lobbyFull && noDrawablePokemon && <p className="tool-status" role="status">You've met every Pokémon available in this lobby.</p>}
            </div>

            {drawStatus === 'error' && (
              <div className="lobby-message error-message">
                <p role="alert">{errorMessage}</p>
                <button className="lobby-button" type="button" onClick={drawPokemon}>Try again</button>
              </div>
            )}

            {drawnPokemon && (
              <PokemonReveal
                pokemon={drawnPokemon}
                onAdopt={adoptDrawnPokemon}
                onSkip={() => setDrawnPokemon(null)}
              />
            )}

            {pokemon.length > 0 ? (
              <ul className="pokemon-grid" aria-label="Adopted Pokémon" role="list">
                {pokemon.map((guest) => (
                  <PokemonCard
                    key={guest.id}
                    pokemon={guest}
                    pet={petStates[guest.id] ?? INITIAL_PET_STATE}
                    onSelect={selectPokemon}
                    onInteract={(action) => interactWithPokemon(action, guest.id)}
                    onPermanentReturn={permanentlyReturnPokemon}
                  />
                ))}
              </ul>
            ) : (
              <p className="lobby-message empty-lobby">Your lobby is ready for its first Pokémon.</p>
            )}
          </section>
        </div>
      </main>

      <footer className="site-footer page-width">
        <p><span aria-hidden="true">✦</span> Built with curiosity. Made for learning.</p>
        <p>Pokémon care and adoption game</p>
      </footer>
    </>
  );
}
