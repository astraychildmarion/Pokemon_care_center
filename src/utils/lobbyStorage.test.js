import { beforeEach, describe, expect, it } from 'vitest';
import { loadLobbyState, saveLobbyState } from './lobbyStorage';

const bulbasaur = {
  id: 1,
  name: 'bulbasaur',
  image: 'https://example.com/bulbasaur.png',
  types: ['grass', 'poison'],
  height: 0.7,
  weight: 6.9,
  abilities: ['overgrow'],
  stats: [{ name: 'hp', value: 45 }],
  cry: null,
};

beforeEach(() => localStorage.clear());

describe('lobby storage', () => {
  it('saves and restores adopted Pokémon with their care state', () => {
    const state = {
      pokemon: [bulbasaur],
      petStates: { 1: { health: 95, hunger: 72, happiness: 81 } },
      returnedPokemonIds: [4, 25],
    };

    saveLobbyState(state);

    expect(loadLobbyState()).toEqual(state);
  });

  it.each([null, '{broken json', JSON.stringify({ pokemon: 'invalid' })])(
    'uses an empty lobby for missing or malformed saved data (%j)',
    (savedValue) => {
      if (savedValue !== null) localStorage.setItem('pokemon-adoption-lobby', savedValue);

      expect(loadLobbyState()).toEqual({ pokemon: [], petStates: {}, returnedPokemonIds: [] });
    },
  );

  it('restores unique returned IDs and keeps them out of the active lobby', () => {
    localStorage.setItem('pokemon-adoption-lobby', JSON.stringify({
      pokemon: [bulbasaur],
      petStates: { 1: { health: 0, hunger: 0, happiness: 0 } },
      returnedPokemonIds: [1, 1, 25, 'invalid'],
    }));

    expect(loadLobbyState()).toEqual({
      pokemon: [],
      petStates: {},
      returnedPokemonIds: [1, 25],
    });
  });
});
