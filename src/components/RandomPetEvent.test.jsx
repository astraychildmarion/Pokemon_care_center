import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RandomPetEvent from './RandomPetEvent';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('RandomPetEvent', () => {
  it.each([
    [0, 'hungry', 'Bulbasaur is feeling hungry.'],
    [0.26, 'wants-play', 'Bulbasaur wants to play.'],
    [0.51, 'tired', 'Bulbasaur feels tired.'],
    [0.76, 'needs-attention', 'Bulbasaur needs a little attention.'],
  ])('shows a controlled event after an infrequent delay (%s)', (eventRandom, eventId, message) => {
    const onEvent = vi.fn();
    const random = vi.fn()
      .mockReturnValueOnce(0) // Minimum delay: 45 seconds.
      .mockReturnValueOnce(eventRandom)
      .mockReturnValue(0);
    render(<RandomPetEvent pokemonName="bulbasaur" onEvent={onEvent} random={random} />);

    act(() => vi.advanceTimersByTime(44_999));
    expect(onEvent).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));

    expect(onEvent).toHaveBeenCalledExactlyOnceWith(eventId);
    expect(screen.getByRole('status')).toHaveTextContent(message);
    expect(vi.getTimerCount()).toBe(1);
  });

  it('allows the message to be dismissed while the next event remains scheduled', () => {
    const random = vi.fn().mockReturnValue(0);
    render(<RandomPetEvent pokemonName="bulbasaur" onEvent={vi.fn()} random={random} />);
    act(() => vi.advanceTimersByTime(45_000));

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss event' }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(1);
  });

  it('cleans up its timer when the detail view is removed', () => {
    const onEvent = vi.fn();
    const { unmount } = render(
      <RandomPetEvent pokemonName="bulbasaur" onEvent={onEvent} random={() => 0} />,
    );

    unmount();
    act(() => vi.advanceTimersByTime(45_000));

    expect(onEvent).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
