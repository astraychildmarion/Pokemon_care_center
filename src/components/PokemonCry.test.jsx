import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PokemonCry from './PokemonCry';

const cry = 'https://example.com/bulbasaur.ogg';
let play;
let pause;

beforeEach(() => {
  play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});

afterEach(() => {
  cleanup(); // Unmount audio while its browser methods are still mocked.
  vi.restoreAllMocks();
});

describe('PokemonCry', () => {
  it('only attempts to play the supplied cry after clicking Play Cry', async () => {
    render(<PokemonCry cry={cry} />);
    expect(play).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Play Cry' }));

    expect(play).toHaveBeenCalledOnce();
    expect(play.mock.instances[0]).toHaveAttribute('src', cry);
    expect(play.mock.instances[0]).toHaveAttribute('preload', 'none');
    expect(await screen.findByText('Playing cry…')).toBeInTheDocument();
  });

  it('explains unavailable cry data and disables playback', () => {
    render(<PokemonCry cry={null} />);

    expect(screen.getByRole('button', { name: 'Play Cry' })).toBeDisabled();
    expect(screen.getByText('No cry available for this Pokémon.')).toBeInTheDocument();
    expect(play).not.toHaveBeenCalled();
  });

  it('prevents overlapping playback and allows replay after the cry ends', async () => {
    let finishStarting;
    play.mockReturnValueOnce(new Promise((resolve) => { finishStarting = resolve; }));
    render(<PokemonCry cry={cry} />);
    const button = screen.getByRole('button', { name: 'Play Cry' });
    fireEvent.click(button);
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(play).toHaveBeenCalledOnce();

    finishStarting();
    await screen.findByText('Playing cry…');
    fireEvent.ended(play.mock.instances[0]);

    expect(button).toBeEnabled();
    expect(screen.queryByText('Playing cry…')).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(play).toHaveBeenCalledTimes(2);
    await screen.findByText('Playing cry…');
  });

  it('shows playback failures and lets the user try again', async () => {
    play.mockRejectedValueOnce(new Error('Playback blocked'));
    render(<PokemonCry cry={cry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play Cry' }));

    expect(await screen.findByText('Couldn’t play this cry. Please try again.')).toHaveAttribute('role', 'status');
    const button = screen.getByRole('button', { name: 'Play Cry' });
    expect(button).toBeEnabled();
    fireEvent.click(button);

    expect(await screen.findByText('Playing cry…')).toBeInTheDocument();
    expect(screen.queryByText(/Couldn’t play/)).not.toBeInTheDocument();
  });

  it('stops the cry when the component is removed', async () => {
    const { unmount } = render(<PokemonCry cry={cry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play Cry' }));
    await screen.findByText('Playing cry…');
    const audio = play.mock.instances[0];

    unmount();

    expect(pause).toHaveBeenCalledOnce();
    expect(pause.mock.instances[0]).toBe(audio);
  });

  it('recovers if the audio element reports a media error after starting', async () => {
    render(<PokemonCry cry={cry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play Cry' }));
    await screen.findByText('Playing cry…');

    fireEvent.error(play.mock.instances[0]);

    expect(screen.getByText('Couldn’t play this cry. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play Cry' })).toBeEnabled();
  });
});
