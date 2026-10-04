export const INITIAL_PET_STATE = { health: 100, hunger: 80, happiness: 80 };

export const CARE_ACTIONS = {
  feed: {
    icon: '🍎',
    label: 'Feed',
    effects: { hunger: 25, happiness: 5 },
  },
  water: {
    icon: '💧',
    label: 'Water',
    effects: { health: 10, hunger: 5 },
  },
  play: {
    icon: '🎾',
    label: 'Play',
    effects: { happiness: 25, hunger: -5 },
  },
};

export const CARE_METRIC_LABELS = {
  health: 'Health',
  hunger: 'Hunger',
  happiness: 'Happiness',
};

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

export function isReturnRequired(pet) {
  return pet.health === 0 && pet.hunger === 0 && pet.happiness === 0;
}

export function updatePetState(pet, action) {
  if (isReturnRequired(pet)) return pet;
  const careAction = CARE_ACTIONS[action];
  if (!careAction) return pet;

  return Object.entries(careAction.effects).reduce((nextPet, [metric, amount]) => ({
    ...nextPet,
    [metric]: clamp(nextPet[metric] + amount),
  }), pet);
}

export function getCareLevel(pet) {
  if (isReturnRequired(pet)) return 'return-required';
  const lowestStatus = Math.min(pet.health, pet.hunger, pet.happiness);
  if (lowestStatus < 20) return 'emergency';
  if (lowestStatus < 50) return 'needs-care';
  if (lowestStatus < 70) return 'needs-attention';
  return 'doing-well';
}

export function decayPetState(pet) {
  if (isReturnRequired(pet)) return pet;
  const hunger = clamp(pet.hunger - 10);
  return {
    health: hunger < 20 ? clamp(pet.health - 10) : pet.health,
    hunger,
    happiness: clamp(pet.happiness - 10),
  };
}

export function applyPetEvent(pet, event) {
  if (isReturnRequired(pet)) return pet;
  switch (event) {
    case 'hungry':
      return { ...pet, hunger: clamp(pet.hunger - 15) };
    case 'wants-play':
      return { ...pet, happiness: clamp(pet.happiness - 10) };
    case 'tired':
      return { ...pet, health: clamp(pet.health - 5) };
    case 'needs-attention':
      return { ...pet, happiness: clamp(pet.happiness - 5) };
    default:
      return pet;
  }
}
