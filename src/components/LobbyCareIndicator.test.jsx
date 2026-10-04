import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LobbyCareIndicator from './LobbyCareIndicator';

const pikachu = { id: 25, name: 'pikachu' };
const psyduck = { id: 54, name: 'psyduck' };

describe('LobbyCareIndicator', () => {
  it('renders an accessible neutral state for an empty lobby', () => {
    render(<LobbyCareIndicator pokemon={[]} petStates={{}} />);

    expect(screen.getByRole('status', { name: 'No Pokémon are currently adopted' }))
      .toHaveTextContent('Lobby empty');
  });

  it('supports keyboard focus and describes every Pokémon requiring care', () => {
    render(
      <LobbyCareIndicator
        pokemon={[pikachu, psyduck]}
        petStates={{
          25: { health: 100, hunger: 0, happiness: 20 },
          54: { health: 100, hunger: 80, happiness: 30 },
        }}
      />,
    );
    const indicator = screen.getByRole('status', { name: 'Pikachu has an emergency' });

    indicator.focus();

    expect(indicator).toHaveFocus();
    expect(indicator).toHaveTextContent('Emergency — 1 Pokémon');
    const tooltip = screen.getByRole('tooltip');
    expect(indicator).toHaveAttribute('aria-describedby', tooltip.id);
    expect(tooltip).toHaveTextContent('Pikachu — Hunger: 0, Happiness: 20 (Emergency)');
    expect(tooltip).toHaveTextContent('Psyduck — Happiness: 30');
    expect(tooltip).not.toHaveTextContent('Health: 100');
  });

  it('announces Return Required while retaining other emergency details', () => {
    render(
      <LobbyCareIndicator
        pokemon={[pikachu, psyduck]}
        petStates={{
          25: { health: 0, hunger: 0, happiness: 0 },
          54: { health: 0, hunger: 40, happiness: 70 },
        }}
      />,
    );

    expect(screen.getByRole('status', { name: '1 Pokémon must be returned' }))
      .toHaveTextContent('Return Required — 1 Pokémon');
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      'Pikachu — Health: 0, Hunger: 0, Happiness: 0 (Return Required)',
    );
    expect(screen.getByRole('tooltip')).toHaveTextContent('Psyduck — Health: 0, Hunger: 40');
  });
});
