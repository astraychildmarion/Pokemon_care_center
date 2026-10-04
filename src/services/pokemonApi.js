const API_BASE_URL = 'https://pokeapi.co/api/v2';
const responseCache = new Map();

function fetchPokemonJson(path) {
  if (responseCache.has(path)) return responseCache.get(path);

  // Cache promises too, so Strict Mode and simultaneous callers share a request.
  const request = fetch(`${API_BASE_URL}/pokemon/${path}`)
    .then((response) => {
      if (!response.ok) {
        if (response.status === 404) throw new Error('Pokémon not found.');
        throw new Error(`Unable to fetch Pokémon data (HTTP ${response.status}).`);
      }
      return response.json();
    })
    .catch((error) => {
      responseCache.delete(path); // Failed requests must remain retryable.
      throw error;
    });

  responseCache.set(path, request);
  return request;
}

export async function fetchPokemonPage({ offset = 0 } = {}) {
  const list = await fetchPokemonJson(`?limit=20&offset=${offset}`);
  const pokemon = await Promise.all(list.results.map(({ name }) => fetchPokemonDetails(name)));

  return {
    pokemon,
    nextOffset: list.next ? offset + list.results.length : null,
  };
}

export async function fetchPokemonDetails(idOrName) {
  const identifier = String(idOrName).trim().toLowerCase();
  const pokemon = await fetchPokemonJson(`${encodeURIComponent(identifier)}/`);

  return {
    id: pokemon.id,
    name: pokemon.name,
    image: pokemon.sprites?.other?.['official-artwork']?.front_default
      || pokemon.sprites?.front_default
      || null,
    types: pokemon.types.map(({ type }) => type.name),
    // PokéAPI uses decimetres and hectograms; our model uses metres and kilograms.
    height: pokemon.height / 10,
    weight: pokemon.weight / 10,
    abilities: pokemon.abilities.map(({ ability }) => ability.name),
    stats: pokemon.stats.map(({ stat, base_stat }) => ({ name: stat.name, value: base_stat })),
    cry: pokemon.cries?.latest || pokemon.cries?.legacy || null,
  };
}
