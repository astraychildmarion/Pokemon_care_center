import { describe, expect, it } from 'vitest';
import { deriveLobbyCare } from './lobbyCare';

const pokemon = (id, name) => ({ id, name });
const healthy = { health: 100, hunger: 80, happiness: 80 };

describe('deriveLobbyCare', () => {
  it('returns a neutral state for an empty lobby', () => {
    expect(deriveLobbyCare([], {})).toEqual({
      level: 'empty',
      label: 'Lobby empty',
      accessibleLabel: 'No Pokémon are currently adopted',
      countAtWorstLevel: 0,
      pokemonNeedingCare: [],
    });
  });

  it('reports Doing Well when every Pokémon is healthy', () => {
    expect(deriveLobbyCare([pokemon(1, 'bulbasaur')], { 1: healthy })).toMatchObject({
      level: 'doing-well',
      label: 'Doing Well',
      accessibleLabel: 'All Pokémon are doing well',
      pokemonNeedingCare: [],
    });
  });

  it('reports Needs Attention and identifies each problematic metric', () => {
    const result = deriveLobbyCare(
      [pokemon(25, 'pikachu')],
      { 25: { health: 69, hunger: 50, happiness: 80 } },
    );

    expect(result).toMatchObject({
      level: 'needs-attention',
      label: 'Needs Attention',
      accessibleLabel: '1 Pokémon needs attention',
      countAtWorstLevel: 1,
    });
    expect(result.pokemonNeedingCare).toEqual([{
      id: 25,
      name: 'Pikachu',
      level: 'needs-attention',
      problems: [
        { label: 'Health', value: 69 },
        { label: 'Hunger', value: 50 },
      ],
    }]);
  });

  it('gives Needs Care priority over Needs Attention while listing both Pokémon', () => {
    const result = deriveLobbyCare(
      [pokemon(133, 'eevee'), pokemon(54, 'psyduck')],
      {
        133: { health: 100, hunger: 60, happiness: 80 },
        54: { health: 100, hunger: 80, happiness: 30 },
      },
    );

    expect(result).toMatchObject({
      level: 'needs-care',
      label: 'Needs Care',
      accessibleLabel: '1 Pokémon needs care',
      countAtWorstLevel: 1,
    });
    expect(result.pokemonNeedingCare.map(({ name }) => name)).toEqual(['Eevee', 'Psyduck']);
  });

  it('gives Emergency priority over every other state', () => {
    const result = deriveLobbyCare(
      [pokemon(25, 'pikachu'), pokemon(54, 'psyduck')],
      {
        25: { health: 100, hunger: 0, happiness: 20 },
        54: { health: 40, hunger: 80, happiness: 80 },
      },
    );

    expect(result).toMatchObject({
      level: 'emergency',
      label: 'Emergency',
      accessibleLabel: 'Pikachu has an emergency',
      countAtWorstLevel: 1,
    });
    expect(result.pokemonNeedingCare[0].problems).toEqual([
      { label: 'Hunger', value: 0 },
      { label: 'Happiness', value: 20 },
    ]);
  });
});
