import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PetCare from './PetCare';

const pet = { health: 80, hunger: 70, happiness: 60 };

describe('PetCare', () => {
  it('shows labeled meters and readable values for all three pet indicators', () => {
    render(<PetCare pet={pet} onInteract={vi.fn()} />);

    expect(screen.getByRole('meter', { name: 'Health' })).toHaveAttribute('value', '80');
    expect(screen.getByRole('meter', { name: 'Hunger' })).toHaveAttribute('value', '70');
    expect(screen.getByRole('meter', { name: 'Happiness' })).toHaveAttribute('value', '60');
    expect(screen.getByText('80/100')).toBeInTheDocument();
    expect(screen.getByText('70/100')).toBeInTheDocument();
    expect(screen.getByText('60/100')).toBeInTheDocument();
    expect(screen.getByText('Hunger +25 · Happiness +5')).toBeInTheDocument();
    expect(screen.getByText('Health +10 · Hunger +5')).toBeInTheDocument();
    expect(screen.getByText('Happiness +25 · Hunger −5')).toBeInTheDocument();
  });

  it.each([['Feed', 'feed'], ['Give Water', 'water'], ['Play', 'play']])(
    'sends the action to its parent when %s is activated',
    (label, action) => {
      const onInteract = vi.fn();
      render(<PetCare pet={pet} onInteract={onInteract} />);

      fireEvent.click(screen.getByRole('button', { name: label }));

      expect(onInteract).toHaveBeenCalledExactlyOnceWith(action);
    },
  );

  it('shows Needs food below 30 and removes it when hunger recovers', () => {
    const onInteract = vi.fn();
    const { rerender } = render(<PetCare pet={{ ...pet, hunger: 29 }} onInteract={onInteract} />);

    expect(screen.getByRole('status')).toHaveTextContent('Needs food');

    rerender(<PetCare pet={{ ...pet, hunger: 30 }} onInteract={onInteract} />);

    expect(screen.queryByText(/Needs food/)).not.toBeInTheDocument();
  });
});
