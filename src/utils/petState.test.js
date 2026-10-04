import { describe, expect, it } from 'vitest';
import {
  applyPetEvent,
  decayPetState,
  getCareLevel,
  INITIAL_PET_STATE,
  updatePetState,
} from './petState';

const pet = { health: 80, hunger: 70, happiness: 60 };

describe('pet interactions', () => {
  it('starts an adopted Pokémon with the game’s initial care values', () => {
    expect(INITIAL_PET_STATE).toEqual({ health: 100, hunger: 80, happiness: 80 });
  });

  it('Feed improves hunger and happiness', () => {
    expect(updatePetState(pet, 'feed')).toEqual({ health: 80, hunger: 95, happiness: 65 });
  });

  it('Give Water improves health and hunger', () => {
    expect(updatePetState(pet, 'water')).toEqual({ health: 90, hunger: 75, happiness: 60 });
  });

  it('Play improves happiness and makes the Pokémon a little hungrier', () => {
    expect(updatePetState(pet, 'play')).toEqual({ health: 80, hunger: 65, happiness: 85 });
  });

  it.each([
    ['feed', { health: 80, hunger: 100, happiness: 100 }],
    ['play', { health: 80, hunger: 90, happiness: 100 }],
  ])('caps increased values at 100 (%s)', (action, expected) => {
    expect(updatePetState({ health: 80, hunger: 95, happiness: 95 }, action)).toEqual(expected);
  });

  it('caps health at 100 when giving water', () => {
    expect(updatePetState({ ...pet, health: 95 }, 'water').health).toBe(100);
  });

  it('keeps hunger at or above zero when playing', () => {
    expect(updatePetState({ ...pet, hunger: 5 }, 'play').hunger).toBe(0);
  });
});

describe('care levels', () => {
  it.each([
    [{ health: 70, hunger: 80, happiness: 100 }, 'doing-well'],
    [{ health: 69, hunger: 80, happiness: 100 }, 'needs-attention'],
    [{ health: 50, hunger: 80, happiness: 100 }, 'needs-attention'],
    [{ health: 49, hunger: 80, happiness: 100 }, 'needs-care'],
    [{ health: 80, hunger: 20, happiness: 100 }, 'needs-care'],
    [{ health: 80, hunger: 19, happiness: 100 }, 'emergency'],
    [{ health: 0, hunger: 80, happiness: 100 }, 'emergency'],
  ])('classifies %j as %s', (status, level) => {
    expect(getCareLevel(status)).toBe(level);
  });
});

describe('status decay', () => {
  it('gradually lowers hunger and happiness without normally lowering health', () => {
    expect(decayPetState({ health: 100, hunger: 80, happiness: 80 }))
      .toEqual({ health: 100, hunger: 70, happiness: 70 });
  });

  it('slowly lowers health when the decayed hunger is critical', () => {
    expect(decayPetState({ health: 50, hunger: 20, happiness: 40 }))
      .toEqual({ health: 40, hunger: 10, happiness: 30 });
  });

  it('never lowers a status below zero', () => {
    expect(decayPetState({ health: 0, hunger: 1, happiness: 0 }))
      .toEqual({ health: 0, hunger: 0, happiness: 0 });
  });
});

describe('random pet events', () => {
  it.each([
    ['hungry', { health: 80, hunger: 55, happiness: 60 }],
    ['wants-play', { health: 80, hunger: 70, happiness: 50 }],
    ['tired', { health: 75, hunger: 70, happiness: 60 }],
    ['needs-attention', { health: 80, hunger: 70, happiness: 55 }],
  ])('applies the %s event to the intended value', (event, expected) => {
    expect(applyPetEvent(pet, event)).toEqual(expected);
  });

  it('keeps event values at or above zero', () => {
    const lowPet = { health: 3, hunger: 4, happiness: 2 };

    expect(applyPetEvent(lowPet, 'hungry').hunger).toBe(0);
    expect(applyPetEvent(lowPet, 'wants-play').happiness).toBe(0);
    expect(applyPetEvent(lowPet, 'tired').health).toBe(0);
    expect(applyPetEvent(lowPet, 'needs-attention').happiness).toBe(0);
  });
});
