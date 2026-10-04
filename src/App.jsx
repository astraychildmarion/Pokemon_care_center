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
  updatePetState,
} from './utils/petState';
import { addPokemonToLobby, MAX_LOBBY_SIZE, selectAvailablePokemonId } from './utils/pokemonDraw';
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
  const [gameSpeed, setGameSpeed] = useState(DEFAULT_GAME_SPEED);
  const returnFocusRef = useRef(null);
  const drawButtonRef = useRef(null);
  const drawInProgressRef = useRef(false);
  const lobbyFull = pokemon.length >= MAX_LOBBY_SIZE;

  function selectPokemon(guest) {
    returnFocusRef.current = document.activeElement;
    setSelectedPokemon(guest);
  }

  function interactWithPokemon(action) {
    if (!selectedPokemon) return;
    const id = selectedPokemon.id;
    setPetStates((states) => ({
      ...states,
      [id]: updatePetState(states[id] ?? INITIAL_PET_STATE, action),
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
    if (lobbyFull || drawnPokemon || drawInProgressRef.current) return;
    const pokemonId = selectAvailablePokemonId(pokemon);
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

  useEffect(() => {
    if (!selectedPokemon) returnFocusRef.current?.focus();
  }, [selectedPokemon]);

  useEffect(() => {
    if (pokemon.length === 0) return undefined;

    const timerId = setInterval(() => {
      setPetStates((states) => {
        const decayedStates = { ...states };
        pokemon.forEach(({ id }) => {
          decayedStates[id] = decayPetState(states[id] ?? INITIAL_PET_STATE);
        });
        return decayedStates;
      });
    }, GAME_SPEEDS[gameSpeed].intervalMs);

    return () => clearInterval(timerId);
  }, [pokemon, gameSpeed]);

  useEffect(() => {
    saveLobbyState({ pokemon, petStates });
  }, [pokemon, petStates]);

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
          />
        )}
        <div hidden={selectedPokemon !== null}>
          <div className="welcome">
            <p className="eyebrow"><span aria-hidden="true">✦</span> Welcome, trainer</p>
            <h1>Meet a new friend. <br />Make them feel at home.</h1>
            <p className="welcome-description">
              Draw a Pokémon, choose whether to adopt, and care for your growing lobby.
            </p>
            <a className="lobby-link" href="#pokemon-lobby">Visit the lobby <span aria-hidden="true">↗</span></a>
            <div className="welcome-art" aria-hidden="true">
              <span className="orbit orbit-one" />
              <span className="orbit orbit-two" />
              <span className="hero-spark spark-one">✦</span>
              <span className="hero-spark spark-two">✧</span>
              <span className="pokeball hero-ball" />
              <span className="art-caption">Your next friend is waiting</span>
            </div>
          </div>

          <section id="pokemon-lobby" className="lobby" aria-labelledby="lobby-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Make yourself at home</p>
                <h2 id="lobby-title">Pokémon Lobby</h2>
              </div>
              <span className="preview-label">{pokemon.length} / {MAX_LOBBY_SIZE} Pokémon</span>
            </div>
            <p className="lobby-description">Draw a Pokémon and decide who will join your lobby.</p>

            <div className="draw-panel">
              <GameSpeedControl value={gameSpeed} onChange={setGameSpeed} />
              <button
                ref={drawButtonRef}
                className="lobby-button draw-button"
                type="button"
                disabled={lobbyFull || drawStatus === 'loading' || Boolean(drawnPokemon)}
                onClick={drawPokemon}
              >
                {drawStatus === 'loading' ? 'Drawing Pokémon…' : 'Draw Pokémon'}
              </button>
              {lobbyFull && <p role="status">Your lobby is full. Return a Pokémon to make space.</p>}
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
