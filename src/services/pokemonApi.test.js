import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let fetchPokemonDetails;
let fetchPokemonPage;

beforeEach(async () => {
  // Each test represents a new browser session with an empty service cache.
  vi.resetModules();
  ({ fetchPokemonDetails, fetchPokemonPage } = await import('./pokemonApi'));
});

// Only the fields this application consumes; automated tests never call PokéAPI.
const pokemonResponse = {
  id: 1,
  name: 'bulbasaur',
  height: 7,
  weight: 69,
  sprites: {
    front_default: 'https://example.com/bulbasaur-sprite.png',
    other: {
      'official-artwork': { front_default: 'https://example.com/bulbasaur-art.png' },
    },
  },
  types: [
    { slot: 1, type: { name: 'grass' } },
    { slot: 2, type: { name: 'poison' } },
  ],
  abilities: [{ ability: { name: 'overgrow' }, is_hidden: false }],
  stats: [{ base_stat: 45, stat: { name: 'hp' } }],
  cries: {
    latest: 'https://example.com/bulbasaur-latest.ogg',
    legacy: 'https://example.com/bulbasaur-legacy.ogg',
  },
};

function mockPokemonResponse(response = pokemonResponse) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => response,
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('fetchPokemonDetails', () => {
  it('fetches by name and returns a simple model with artwork and metric dimensions', async () => {
    const fetchMock = mockPokemonResponse();

    const pokemon = await fetchPokemonDetails('bulbasaur');

    expect(fetchMock).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon/bulbasaur/');
    expect(pokemon).toEqual({
      id: 1,
      name: 'bulbasaur',
      image: 'https://example.com/bulbasaur-art.png',
      types: ['grass', 'poison'],
      height: 0.7,
      weight: 6.9,
      abilities: ['overgrow'],
      stats: [{ name: 'hp', value: 45 }],
      cry: 'https://example.com/bulbasaur-latest.ogg',
    });
  });

  it.each([
    { other: { 'official-artwork': { front_default: null } } },
    {},
  ])('uses the default sprite when official artwork is unavailable (%j)', async (sprites) => {
    mockPokemonResponse({
      ...pokemonResponse,
      sprites: { front_default: 'https://example.com/sprite.png', ...sprites },
    });

    const pokemon = await fetchPokemonDetails(1);

    expect(pokemon.image).toBe('https://example.com/sprite.png');
  });

  it('returns null when neither artwork nor a sprite is available', async () => {
    mockPokemonResponse({ ...pokemonResponse, sprites: { front_default: null } });

    expect((await fetchPokemonDetails(1)).image).toBeNull();
  });

  it('uses the legacy cry when the latest cry is unavailable', async () => {
    mockPokemonResponse({
      ...pokemonResponse,
      cries: { latest: null, legacy: 'https://example.com/legacy.ogg' },
    });

    expect((await fetchPokemonDetails(1)).cry).toBe('https://example.com/legacy.ogg');
  });

  it.each([undefined, { latest: null, legacy: null }])(
    'returns null when cry data is unavailable (%j)',
    async (cries) => {
      mockPokemonResponse({ ...pokemonResponse, cries });

      expect((await fetchPokemonDetails(1)).cry).toBeNull();
    },
  );

  it.each([
    [404, 'Pokémon not found.'],
    [503, 'Unable to fetch Pokémon data (HTTP 503).'],
  ])('rejects an unsuccessful HTTP response (%i)', async (status, message) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status,
      json: async () => pokemonResponse,
    }));

    await expect(fetchPokemonDetails('bulbasaur')).rejects.toThrow(message);
  });

  it('keeps network failures available to the caller', async () => {
    const networkError = new TypeError('Failed to fetch');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(networkError));

    await expect(fetchPokemonDetails('bulbasaur')).rejects.toBe(networkError);
  });

  it.each([
    ['  Bulbasaur  ', 'bulbasaur'],
    [1, '1'],
  ])('accepts a name or numeric ID (%j)', async (input, identifier) => {
    const fetchMock = mockPokemonResponse();

    await fetchPokemonDetails(input);

    expect(fetchMock).toHaveBeenCalledWith(`https://pokeapi.co/api/v2/pokemon/${identifier}/`);
  });
});

describe('fetchPokemonPage', () => {
  it('fetches 20 list entries by default and returns their details with the next offset', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url) => ({
      ok: true,
      json: async () => url.includes('?')
        ? {
          results: [{ name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' }],
          next: 'https://pokeapi.co/api/v2/pokemon/?offset=1&limit=20',
        }
        : pokemonResponse,
    }));
    vi.stubGlobal('fetch', fetchMock);

    const page = await fetchPokemonPage();

    expect(fetchMock).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon/?limit=20&offset=0');
    expect(page.pokemon).toHaveLength(1);
    expect(page.pokemon[0]).toMatchObject({ id: 1, name: 'bulbasaur', types: ['grass', 'poison'] });
    expect(page.nextOffset).toBe(1);
  });

  it('uses the requested offset and marks the final page', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [], next: null }),
    });
    vi.stubGlobal('fetch', fetchMock);

    expect(await fetchPokemonPage({ offset: 20 })).toEqual({ pokemon: [], nextOffset: null });
    expect(fetchMock).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon/?limit=20&offset=20');
  });

  it('rejects a failed list request so the lobby can offer retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ results: [], next: null }),
    }));

    await expect(fetchPokemonPage()).rejects.toThrow('Unable to fetch Pokémon data (HTTP 503).');
  });
});

describe('session caching', () => {
  it('shares simultaneous requests and reuses a successful response', async () => {
    const fetchMock = mockPokemonResponse();

    await Promise.all([
      fetchPokemonDetails('bulbasaur'),
      fetchPokemonDetails('  Bulbasaur  '),
    ]);
    await fetchPokemonDetails('bulbasaur');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries failed requests instead of caching the error', async () => {
    const fetchMock = mockPokemonResponse();
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(fetchPokemonDetails('bulbasaur')).rejects.toThrow('Failed to fetch');
    expect(await fetchPokemonDetails('bulbasaur')).toMatchObject({ name: 'bulbasaur' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reuses the list and successful details when retrying a partially failed page', async () => {
    let ivysaurAttempts = 0;
    const fetchMock = vi.fn().mockImplementation(async (url) => {
      if (url.includes('?')) {
        return {
          ok: true,
          json: async () => ({
            results: [{ name: 'bulbasaur' }, { name: 'ivysaur' }],
            next: null,
          }),
        };
      }
      if (url.endsWith('/ivysaur/')) {
        ivysaurAttempts += 1;
        if (ivysaurAttempts === 1) return { ok: false, status: 503 };
        return { ok: true, json: async () => ({ ...pokemonResponse, id: 2, name: 'ivysaur' }) };
      }
      return { ok: true, json: async () => pokemonResponse };
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchPokemonPage()).rejects.toThrow('HTTP 503');
    const page = await fetchPokemonPage();
    await fetchPokemonPage();

    expect(page.pokemon.map(({ name }) => name)).toEqual(['bulbasaur', 'ivysaur']);
    expect(fetchMock).toHaveBeenCalledTimes(4); // One list, one Bulbasaur, two Ivysaur attempts.
  });
});
