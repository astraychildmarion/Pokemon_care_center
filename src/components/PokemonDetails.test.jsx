import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PokemonDetails from './PokemonDetails';

const bulbasaur = {
  id: 1,
  name: 'bulbasaur',
  image: 'https://example.com/bulbasaur.png',
  types: ['grass', 'poison'],
  height: 0.7,
  weight: 6.9,
  abilities: ['overgrow', 'chlorophyll'],
  stats: [{ name: 'hp', value: 45 }, { name: 'special-attack', value: 65 }],
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('PokemonDetails', () => {
  it('displays the supplied Pokémon identity, dimensions, abilities, and base stats', () => {
    render(<PokemonDetails pokemon={bulbasaur} onBack={vi.fn()} />);

    const details = screen.getByRole('region', { name: 'bulbasaur' });
    expect(within(details).getByRole('heading', { level: 1, name: 'bulbasaur' })).toBeInTheDocument();
    expect(within(details).getByRole('img', { name: 'bulbasaur' })).toHaveAttribute('src', bulbasaur.image);
    expect(within(details).getByText('#001')).toBeInTheDocument();
    expect(within(details).getByText('grass')).toBeInTheDocument();
    expect(within(details).getByText('poison')).toBeInTheDocument();
    expect(within(details).getByText('Height')).toBeInTheDocument();
    expect(within(details).getByText('0.7 m')).toBeInTheDocument();
    expect(within(details).getByText('Weight')).toBeInTheDocument();
    expect(within(details).getByText('6.9 kg')).toBeInTheDocument();
    const abilities = within(details).getByRole('list', { name: 'Abilities' });
    expect(within(abilities).getByText('overgrow')).toBeInTheDocument();
    expect(within(abilities).getByText('chlorophyll')).toBeInTheDocument();
    const stats = within(details).getByRole('list', { name: 'Base stats' });
    expect(within(stats).getByText('HP')).toBeInTheDocument();
    expect(within(stats).getByText('45')).toBeInTheDocument();
    expect(within(stats).getByText('special attack')).toBeInTheDocument();
    expect(within(stats).getByText('65')).toBeInTheDocument();
  });

  it('calls the parent when Back to lobby is activated', () => {
    const onBack = vi.fn();
    render(<PokemonDetails pokemon={bulbasaur} onBack={onBack} />);

    fireEvent.click(screen.getByRole('button', { name: 'Back to lobby' }));

    expect(onBack).toHaveBeenCalledOnce();
  });

  it('requires confirmation before returning a Pokémon', () => {
    const onReturn = vi.fn();
    render(<PokemonDetails pokemon={bulbasaur} onBack={vi.fn()} onReturn={onReturn} />);

    fireEvent.click(screen.getByRole('button', { name: 'Return Pokémon' }));

    expect(screen.getByRole('heading', { name: 'Return Bulbasaur?' })).toBeInTheDocument();
    expect(screen.getByText('Bulbasaur will leave your lobby and free one space.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onReturn).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: 'Return Bulbasaur?' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Return Pokémon' })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Return Pokémon' }));
    fireEvent.click(screen.getByRole('button', { name: 'Return Bulbasaur' }));

    expect(onReturn).toHaveBeenCalledExactlyOnceWith(bulbasaur);
  });

  it('provides cry playback using the URL from the Pokémon model', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const pokemon = { ...bulbasaur, cry: 'https://example.com/bulbasaur.ogg' };
    render(<PokemonDetails pokemon={pokemon} onBack={vi.fn()} />);

    expect(play).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Play Cry' }));

    expect(await screen.findByText('Playing cry…')).toBeInTheDocument();
    expect(play.mock.instances[0]).toHaveAttribute('src', pokemon.cry);
  });

  it.each([null, 'https://example.com/broken.png'])(
    'keeps details and Back available when artwork cannot display (%j)',
    (image) => {
      render(<PokemonDetails pokemon={{ ...bulbasaur, image }} onBack={vi.fn()} />);
      if (image) fireEvent.error(screen.getByRole('img', { name: 'bulbasaur' }));

      expect(screen.getByText('Artwork unavailable')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.getByText('0.7 m')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Back to lobby' })).toBeEnabled();
    },
  );

  it('reports a random event while the detail view is open', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const onRandomEvent = vi.fn();
    render(
      <PokemonDetails pokemon={bulbasaur} onBack={vi.fn()} onRandomEvent={onRandomEvent} />,
    );

    act(() => vi.advanceTimersByTime(45_000));

    expect(onRandomEvent).toHaveBeenCalledExactlyOnceWith('hungry');
    expect(screen.getByRole('status')).toHaveTextContent('Bulbasaur is feeling hungry.');
  });
});
