import { describe, expect, it } from 'vitest';
import {
  addPokemonToLobby,
  AVAILABLE_POKEMON_IDS,
  getDrawablePokemonIds,
  selectAvailablePokemonId,
} from './pokemonDraw';

const pokemon = (id) => ({ id, name: `pokemon-${id}` });

describe('addPokemonToLobby', () => {
  it('adds a new Pokémon but rejects duplicates and an eleventh adoption', () => {
    const firstTen = Array.from({ length: 10 }, (_, index) => pokemon(index + 1));

    expect(addPokemonToLobby([], pokemon(1))).toEqual([pokemon(1)]);
    expect(addPokemonToLobby([pokemon(1)], pokemon(1))).toEqual([pokemon(1)]);
    expect(addPokemonToLobby(firstTen, pokemon(11))).toEqual(firstTen);
  });
});

describe('drawable Pokémon', () => {
  it('derives candidates before choosing and excludes adopted and permanently returned IDs', () => {
    expect(getDrawablePokemonIds([pokemon(1)], [4, 7])).not.toContain(1);
    expect(getDrawablePokemonIds([pokemon(1)], [4, 7])).not.toContain(4);
    expect(getDrawablePokemonIds([pokemon(1)], [4, 7])).not.toContain(7);
    expect(selectAvailablePokemonId([pokemon(1)], [4, 7], () => 0)).toBe(25);
  });

  it('returns null without calling random when the candidate pool is empty', () => {
    let randomCalls = 0;
    const random = () => {
      randomCalls += 1;
      return 0;
    };

    expect(selectAvailablePokemonId([], AVAILABLE_POKEMON_IDS, random)).toBeNull();
    expect(randomCalls).toBe(0);
  });
});
