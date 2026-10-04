export const AVAILABLE_POKEMON_IDS = [
  1, 4, 7, 25, 39, 52, 54, 58, 63, 66,
  74, 92, 133, 143, 147, 152, 155, 158, 172, 175,
  179, 196, 197, 216, 246, 280, 300, 333, 447, 448,
];

export const MAX_LOBBY_SIZE = 10;

export function addPokemonToLobby(adoptedPokemon, pokemon) {
  if (adoptedPokemon.length >= MAX_LOBBY_SIZE) return adoptedPokemon;
  if (adoptedPokemon.some(({ id }) => id === pokemon.id)) return adoptedPokemon;
  return [...adoptedPokemon, pokemon];
}

export function selectAvailablePokemonId(adoptedPokemon, random = Math.random) {
  const adoptedIds = new Set(adoptedPokemon.map(({ id }) => id));
  const availableIds = AVAILABLE_POKEMON_IDS.filter((id) => !adoptedIds.has(id));
  if (availableIds.length === 0) return null;

  const index = Math.min(Math.floor(random() * availableIds.length), availableIds.length - 1);
  return availableIds[index];
}
