import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { fetchPokemonDetails } from './services/pokemonApi';
import { AVAILABLE_POKEMON_IDS } from './utils/pokemonDraw';

vi.mock('./services/pokemonApi', () => ({
  fetchPokemonDetails: vi.fn(),
}));

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
const charmander = { ...bulbasaur, id: 4, name: 'charmander', types: ['fire'] };

beforeEach(() => {
  localStorage.clear();
  fetchPokemonDetails.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Pokémon adoption lobby', () => {
  it('keeps a derived lobby care summary in the header', async () => {
    fetchPokemonDetails.mockResolvedValue(bulbasaur);
    render(<App />);

    expect(screen.getByRole('status', { name: 'No Pokémon are currently adopted' }))
      .toHaveTextContent('Lobby empty');
    fireEvent.click(screen.getByRole('button', { name: 'Draw Pokémon' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Adopt Bulbasaur' }));

    expect(screen.getByRole('status', { name: 'All Pokémon are doing well' }))
      .toHaveTextContent('Doing Well');
  });

  it('draws a Pokémon on request and Skip leaves the lobby empty', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    fetchPokemonDetails.mockResolvedValue(bulbasaur);
    render(<App />);

    expect(fetchPokemonDetails).not.toHaveBeenCalled();
    expect(screen.getByText('0 / 10 Pokémon')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Draw Pokémon' }));

    expect(fetchPokemonDetails).toHaveBeenCalledWith(1);
    expect(await screen.findByRole('heading', { name: 'You found Bulbasaur!' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Bulbasaur' })).toHaveAttribute('src', bulbasaur.image);
    fireEvent.click(screen.getByRole('button', { name: 'Skip Bulbasaur' }));

    expect(screen.queryByRole('heading', { name: 'You found Bulbasaur!' })).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Adopted Pokémon' })).not.toBeInTheDocument();
    expect(screen.getByText('0 / 10 Pokémon')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Pokémon Lobby' }))
      .getByRole('button', { name: 'Draw Pokémon' })).toBeEnabled();
  });

  it('adopts the revealed Pokémon and excludes it from later draws', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    fetchPokemonDetails
      .mockResolvedValueOnce(bulbasaur)
      .mockResolvedValueOnce(charmander);
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Draw Pokémon' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Adopt Bulbasaur' }));

    const lobby = screen.getByRole('list', { name: 'Adopted Pokémon' });
    expect(within(lobby).getByRole('heading', { name: 'bulbasaur' })).toBeInTheDocument();
    expect(screen.getByText('1 / 10 Pokémon')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Draw Pokémon' }));

    expect(await screen.findByRole('heading', { name: 'You found Charmander!' })).toBeInTheDocument();
    expect(fetchPokemonDetails.mock.calls).toEqual([[1], [4]]);
    expect(within(lobby).getAllByRole('listitem')).toHaveLength(1);
  });

  it('disables drawing and announces when ten Pokémon have been adopted', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    fetchPokemonDetails.mockImplementation(async (id) => ({
      ...bulbasaur,
      id,
      name: `pokemon-${id}`,
    }));
    render(<App />);

    for (let adoption = 0; adoption < 10; adoption += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Draw Pokémon' }));
      fireEvent.click(await screen.findByRole('button', { name: /^Adopt / }));
    }

    expect(screen.getByText('10 / 10 Pokémon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Draw Pokémon' })).toBeDisabled();
    expect(screen.getByText('Your lobby is full. Return a Pokémon to make space.'))
      .toHaveAttribute('role', 'status');
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
    expect(fetchPokemonDetails).toHaveBeenCalledTimes(10);
  });

  it('shows a retryable error without adding a broken Pokémon', async () => {
    fetchPokemonDetails
      .mockRejectedValueOnce(new Error('Unable to fetch Pokémon data (HTTP 503).'))
      .mockResolvedValueOnce(bulbasaur);
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Draw Pokémon' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('HTTP 503');
    expect(screen.queryByRole('list', { name: 'Adopted Pokémon' })).not.toBeInTheDocument();
    expect(screen.getByText('0 / 10 Pokémon')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'You found Bulbasaur!' })).toBeInTheDocument();
  });

  it('opens an adopted Pokémon’s existing details and restores card focus on Back', async () => {
    fetchPokemonDetails.mockResolvedValue(bulbasaur);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Draw Pokémon' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Adopt Bulbasaur' }));
    const cardButton = screen.getByRole('button', { name: 'Select bulbasaur' });

    fireEvent.click(cardButton);

    expect(screen.getByRole('heading', { level: 1, name: 'bulbasaur' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Back to lobby' }));
    expect(cardButton).toHaveFocus();
  });

  it('starts an adoption with healthy care values and reflects detail care on its card', async () => {
    fetchPokemonDetails.mockResolvedValue(bulbasaur);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Draw Pokémon' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Adopt Bulbasaur' }));

    expect(screen.getByRole('meter', { name: 'bulbasaur health' })).toHaveAttribute('value', '100');
    expect(screen.getByRole('meter', { name: 'bulbasaur hunger' })).toHaveAttribute('value', '80');
    expect(screen.getByRole('meter', { name: 'bulbasaur happiness' })).toHaveAttribute('value', '80');
    fireEvent.click(screen.getByRole('button', { name: 'Select bulbasaur' }));
    fireEvent.click(screen.getByRole('button', { name: 'Feed' }));

    expect(screen.getByRole('meter', { name: 'Hunger' })).toHaveAttribute('value', '100');
    expect(screen.getByRole('meter', { name: 'Happiness' })).toHaveAttribute('value', '85');
    fireEvent.click(screen.getByRole('button', { name: 'Back to lobby' }));
    expect(screen.getByRole('meter', { name: 'bulbasaur hunger' })).toHaveAttribute('value', '100');
    expect(screen.getByRole('meter', { name: 'bulbasaur happiness' })).toHaveAttribute('value', '85');
  });

  it('uses one cleaned-up timer to decay every adopted Pokémon while the app runs', async () => {
    vi.useFakeTimers();
    const intervalSpy = vi.spyOn(globalThis, 'setInterval');
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    vi.spyOn(Math, 'random').mockReturnValue(0);
    fetchPokemonDetails
      .mockResolvedValueOnce(bulbasaur)
      .mockResolvedValueOnce(charmander);
    const { unmount } = render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Draw Pokémon' }));
    await act(async () => Promise.resolve());
    fireEvent.click(screen.getByRole('button', { name: 'Adopt Bulbasaur' }));
    fireEvent.click(screen.getByRole('button', { name: 'Draw Pokémon' }));
    await act(async () => Promise.resolve());
    fireEvent.click(screen.getByRole('button', { name: 'Adopt Charmander' }));

    expect(intervalSpy.mock.calls.length - clearIntervalSpy.mock.calls.length).toBe(1);
    act(() => vi.advanceTimersByTime(10_000));

    for (const name of ['bulbasaur', 'charmander']) {
      expect(screen.getByRole('meter', { name: `${name} health` })).toHaveAttribute('value', '100');
      expect(screen.getByRole('meter', { name: `${name} hunger` })).toHaveAttribute('value', '70');
      expect(screen.getByRole('meter', { name: `${name} happiness` })).toHaveAttribute('value', '70');
    }

    unmount();
    expect(intervalSpy.mock.calls.length - clearIntervalSpy.mock.calls.length).toBe(0);
  });

  it('replaces the decay timer immediately when game speed changes without changing pet values', async () => {
    vi.useFakeTimers();
    const intervalSpy = vi.spyOn(globalThis, 'setInterval');
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    fetchPokemonDetails.mockResolvedValue(bulbasaur);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Draw Pokémon' }));
    await act(async () => Promise.resolve());
    fireEvent.click(screen.getByRole('button', { name: 'Adopt Bulbasaur' }));

    const speedControl = screen.getByRole('combobox', { name: 'Game speed' });
    expect(speedControl).toHaveValue('normal');
    expect(screen.getByText('Normal — needs change every 10 seconds')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(9_999));
    expect(screen.getByRole('meter', { name: 'bulbasaur hunger' })).toHaveAttribute('value', '80');

    fireEvent.change(speedControl, { target: { value: 'fast' } });

    expect(screen.getByText('Fast — needs change every 5 seconds')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'bulbasaur hunger' })).toHaveAttribute('value', '80');
    expect(intervalSpy.mock.calls.length - clearIntervalSpy.mock.calls.length).toBe(1);
    act(() => vi.advanceTimersByTime(4_999));
    expect(screen.getByRole('meter', { name: 'bulbasaur hunger' })).toHaveAttribute('value', '80');
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole('meter', { name: 'bulbasaur hunger' })).toHaveAttribute('value', '70');
    expect(screen.getByRole('meter', { name: 'bulbasaur happiness' })).toHaveAttribute('value', '70');
  });

  it('updates the global indicator after decay and improves it after care', async () => {
    vi.useFakeTimers();
    fetchPokemonDetails.mockResolvedValue(bulbasaur);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Draw Pokémon' }));
    await act(async () => Promise.resolve());
    fireEvent.click(screen.getByRole('button', { name: 'Adopt Bulbasaur' }));

    act(() => vi.advanceTimersByTime(20_000));
    expect(screen.getByRole('status', { name: '1 Pokémon needs attention' }))
      .toHaveTextContent('Needs Attention');

    fireEvent.click(screen.getByRole('button', { name: 'Select bulbasaur' }));
    fireEvent.click(screen.getByRole('button', { name: 'Feed' }));
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));

    expect(screen.getByRole('status', { name: 'All Pokémon are doing well' }))
      .toHaveTextContent('Doing Well');
    expect(screen.getByRole('heading', { level: 1, name: 'bulbasaur' })).toBeInTheDocument();
  });

  it('returns a confirmed Pokémon, frees capacity, and clears its care state', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    fetchPokemonDetails.mockResolvedValue(bulbasaur);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Draw Pokémon' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Adopt Bulbasaur' }));
    fireEvent.click(screen.getByRole('button', { name: 'Select bulbasaur' }));
    fireEvent.click(screen.getByRole('button', { name: 'Feed' }));

    fireEvent.click(screen.getByRole('button', { name: 'Return Pokémon' }));
    fireEvent.click(screen.getByRole('button', { name: 'Return Bulbasaur' }));

    expect(screen.queryByRole('heading', { name: 'bulbasaur' })).not.toBeInTheDocument();
    expect(screen.getByText('0 / 10 Pokémon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Draw Pokémon' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Draw Pokémon' })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Draw Pokémon' }));
    expect(fetchPokemonDetails).toHaveBeenLastCalledWith(1);
    fireEvent.click(await screen.findByRole('button', { name: 'Adopt Bulbasaur' }));
    expect(screen.getByRole('meter', { name: 'bulbasaur hunger' })).toHaveAttribute('value', '80');
    expect(screen.getByRole('meter', { name: 'bulbasaur happiness' })).toHaveAttribute('value', '80');
  });

  it('restores adopted Pokémon and care state after a fresh mount without fetching', async () => {
    fetchPokemonDetails.mockResolvedValue(bulbasaur);
    const firstVisit = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Draw Pokémon' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Adopt Bulbasaur' }));
    fireEvent.click(screen.getByRole('button', { name: 'Select bulbasaur' }));
    fireEvent.click(screen.getByRole('button', { name: 'Feed' }));
    firstVisit.unmount();
    fetchPokemonDetails.mockClear();

    render(<App />);

    expect(screen.getByRole('heading', { name: 'bulbasaur' })).toBeInTheDocument();
    expect(screen.getByText('1 / 10 Pokémon')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'bulbasaur health' })).toHaveAttribute('value', '100');
    expect(screen.getByRole('meter', { name: 'bulbasaur hunger' })).toHaveAttribute('value', '100');
    expect(screen.getByRole('meter', { name: 'bulbasaur happiness' })).toHaveAttribute('value', '85');
    expect(fetchPokemonDetails).not.toHaveBeenCalled();
  });

  it('permanently returns a failed-care Pokémon and excludes it after restoration', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    localStorage.setItem('pokemon-adoption-lobby', JSON.stringify({
      pokemon: [bulbasaur],
      petStates: { 1: { health: 0, hunger: 0, happiness: 0 } },
      returnedPokemonIds: [],
    }));
    fetchPokemonDetails.mockResolvedValue(charmander);
    const firstVisit = render(<App />);

    expect(screen.getByRole('status', { name: '1 Pokémon must be returned' }))
      .toHaveTextContent('Return Required');
    expect(screen.getByText('1 / 10 Pokémon')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Return Bulbasaur' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm return Bulbasaur' }));

    expect(screen.getByText('0 / 10 Pokémon')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('pokemon-adoption-lobby')).returnedPokemonIds)
      .toEqual([1]);
    fireEvent.click(screen.getByRole('button', { name: 'Draw Pokémon' }));
    expect(fetchPokemonDetails).toHaveBeenLastCalledWith(4);

    firstVisit.unmount();
    fetchPokemonDetails.mockClear();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Draw Pokémon' }));
    expect(fetchPokemonDetails).toHaveBeenLastCalledWith(4);
  });

  it('disables drawing when every supported Pokémon is permanently unavailable', () => {
    localStorage.setItem('pokemon-adoption-lobby', JSON.stringify({
      pokemon: [],
      petStates: {},
      returnedPokemonIds: AVAILABLE_POKEMON_IDS,
    }));

    render(<App />);

    expect(screen.getByRole('button', { name: 'Draw Pokémon' })).toBeDisabled();
    expect(screen.getByText("You've met every Pokémon available in this lobby."))
      .toHaveAttribute('role', 'status');
  });
});
