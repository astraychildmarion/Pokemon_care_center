import { describe, expect, it } from 'vitest';
import { addPokemonToLobby } from './pokemonDraw';

const pokemon = (id) => ({ id, name: `pokemon-${id}` });

describe('addPokemonToLobby', () => {
  it('adds a new Pokémon but rejects duplicates and an eleventh adoption', () => {
    const firstTen = Array.from({ length: 10 }, (_, index) => pokemon(index + 1));

    expect(addPokemonToLobby([], pokemon(1))).toEqual([pokemon(1)]);
    expect(addPokemonToLobby([pokemon(1)], pokemon(1))).toEqual([pokemon(1)]);
    expect(addPokemonToLobby(firstTen, pokemon(11))).toEqual(firstTen);
  });
});
