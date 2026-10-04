import { getCareLevel, INITIAL_PET_STATE } from './petState';

const LEVELS = {
  'doing-well': { label: 'Doing Well', priority: 0 },
  'needs-attention': { label: 'Needs Attention', priority: 1 },
  'needs-care': { label: 'Needs Care', priority: 2 },
  emergency: { label: 'Emergency', priority: 3 },
};

function formatName(name) {
  const displayName = name.replaceAll('-', ' ');
  return displayName.charAt(0).toUpperCase() + displayName.slice(1);
}

function accessibleLabel(level, count, pokemonAtWorstLevel) {
  if (level === 'doing-well') return 'All Pokémon are doing well';
  if (level === 'needs-attention') {
    return count === 1 ? '1 Pokémon needs attention' : `${count} Pokémon need attention`;
  }
  if (level === 'needs-care') {
    return count === 1 ? '1 Pokémon needs care' : `${count} Pokémon need care`;
  }
  if (count === 1) return `${pokemonAtWorstLevel[0].name} has an emergency`;
  return `${count} Pokémon have an emergency`;
}

export function deriveLobbyCare(pokemon, petStates) {
  if (pokemon.length === 0) {
    return {
      level: 'empty',
      label: 'Lobby empty',
      accessibleLabel: 'No Pokémon are currently adopted',
      countAtWorstLevel: 0,
      pokemonNeedingCare: [],
    };
  }

  const summaries = pokemon.map((guest) => {
    const pet = petStates[guest.id] ?? INITIAL_PET_STATE;
    const level = getCareLevel(pet);
    const problems = [
      ['Health', pet.health],
      ['Hunger', pet.hunger],
      ['Happiness', pet.happiness],
    ].filter(([, value]) => value < 70)
      .map(([label, value]) => ({ label, value }));

    return {
      id: guest.id,
      name: formatName(guest.name),
      level,
      problems,
    };
  });
  const worstPriority = Math.max(...summaries.map(({ level }) => LEVELS[level].priority));
  const level = Object.keys(LEVELS)
    .find((key) => LEVELS[key].priority === worstPriority);
  const pokemonAtWorstLevel = summaries.filter((summary) => summary.level === level);
  const pokemonNeedingCare = summaries.filter((summary) => summary.level !== 'doing-well');

  return {
    level,
    label: LEVELS[level].label,
    accessibleLabel: accessibleLabel(level, pokemonAtWorstLevel.length, pokemonAtWorstLevel),
    countAtWorstLevel: pokemonAtWorstLevel.length,
    pokemonNeedingCare,
  };
}
