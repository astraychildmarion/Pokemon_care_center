import { MAX_LOBBY_SIZE } from './pokemonDraw';

const STORAGE_KEY = 'pokemon-adoption-lobby';
const EMPTY_LOBBY = { pokemon: [], petStates: {} };

function getBrowserStorage(storage) {
  if (storage) return storage;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isPokemon(pokemon) {
  return Number.isInteger(pokemon?.id)
    && typeof pokemon.name === 'string'
    && Array.isArray(pokemon.types)
    && Array.isArray(pokemon.abilities)
    && Array.isArray(pokemon.stats);
}

function isPetState(pet) {
  return ['health', 'hunger', 'happiness']
    .every((key) => Number.isFinite(pet?.[key]) && pet[key] >= 0 && pet[key] <= 100);
}

export function loadLobbyState(storage) {
  const browserStorage = getBrowserStorage(storage);
  if (!browserStorage) return EMPTY_LOBBY;

  try {
    const savedState = JSON.parse(browserStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(savedState?.pokemon) || typeof savedState.petStates !== 'object') {
      return EMPTY_LOBBY;
    }

    const seenIds = new Set();
    const pokemon = savedState.pokemon
      .filter((guest) => {
        if (!isPokemon(guest) || seenIds.has(guest.id)) return false;
        seenIds.add(guest.id);
        return true;
      })
      .slice(0, MAX_LOBBY_SIZE);
    const petStates = {};
    pokemon.forEach(({ id }) => {
      if (isPetState(savedState.petStates[id])) petStates[id] = savedState.petStates[id];
    });

    return { pokemon, petStates };
  } catch {
    return EMPTY_LOBBY;
  }
}

export function saveLobbyState(state, storage) {
  const browserStorage = getBrowserStorage(storage);
  if (!browserStorage) return;

  try {
    browserStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The game remains usable when storage is unavailable or full.
  }
}
