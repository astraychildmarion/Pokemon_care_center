import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PokemonCard from './PokemonCard';

const bulbasaur = {
  id: 1,
  name: 'bulbasaur',
  image: 'https://example.com/bulbasaur.png',
  types: ['grass', 'poison'],
};
const healthyPet = { health: 100, hunger: 80, happiness: 80 };

describe('PokemonCard', () => {
  it('displays the supplied Pokémon artwork, number, name, and types', () => {
    render(<ul><PokemonCard pokemon={bulbasaur} onSelect={vi.fn()} /></ul>);

    expect(screen.getByRole('heading', { level: 3, name: 'bulbasaur' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'bulbasaur' })).toHaveAttribute('src', bulbasaur.image);
    expect(screen.getByText('#001')).toBeInTheDocument();
    expect(screen.getByText('grass')).toBeInTheDocument();
    expect(screen.getByText('poison')).toBeInTheDocument();
  });

  it('passes the Pokémon to its callback through an accessible selection button', () => {
    const onSelect = vi.fn();
    render(<ul><PokemonCard pokemon={bulbasaur} onSelect={onSelect} /></ul>);

    const button = screen.getByRole('button', { name: 'Select bulbasaur' });
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.click(button);

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(bulbasaur);
  });

  it('shows when the parent marks the card as selected', () => {
    render(<ul><PokemonCard pokemon={bulbasaur} onSelect={vi.fn()} isSelected /></ul>);

    expect(screen.getByText('Selected')).toBeInTheDocument();
  });

  it('replaces broken artwork with a fallback and displays a new image when props change', () => {
    const onSelect = vi.fn();
    const { rerender } = render(<ul><PokemonCard pokemon={bulbasaur} onSelect={onSelect} /></ul>);

    fireEvent.error(screen.getByRole('img', { name: 'bulbasaur' }));

    expect(screen.getByText('Artwork unavailable')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Select bulbasaur' }));
    expect(onSelect).toHaveBeenCalledWith(bulbasaur);

    const newImage = { ...bulbasaur, image: 'https://example.com/new-artwork.png' };
    rerender(<ul><PokemonCard pokemon={newImage} onSelect={onSelect} /></ul>);

    expect(screen.getByRole('img', { name: 'bulbasaur' })).toHaveAttribute('src', newImage.image);
    expect(screen.queryByText('Artwork unavailable')).not.toBeInTheDocument();
  });

  it('shows compact care indicators and removes warnings when the Pokémon recovers', () => {
    const { rerender } = render(
      <ul>
        <PokemonCard
          pokemon={bulbasaur}
          pet={{ health: 49, hunger: 19, happiness: 80 }}
          onSelect={vi.fn()}
        />
      </ul>,
    );

    expect(screen.getByRole('meter', { name: 'bulbasaur health' })).toHaveAttribute('value', '49');
    expect(screen.getByRole('meter', { name: 'bulbasaur hunger' })).toHaveAttribute('value', '19');
    expect(screen.getByRole('meter', { name: 'bulbasaur happiness' })).toHaveAttribute('value', '80');
    expect(screen.getByText('Emergency')).toBeInTheDocument();
    expect(screen.getByText(/Needs rest/)).toBeInTheDocument();
    expect(screen.getByText(/Needs food/)).toBeInTheDocument();

    rerender(
      <ul><PokemonCard pokemon={bulbasaur} pet={healthyPet} onSelect={vi.fn()} /></ul>,
    );

    expect(screen.getByText('Doing well')).toBeInTheDocument();
    expect(screen.queryByText(/Needs rest|Needs food/)).not.toBeInTheDocument();
  });

  it('labels values from 20 through 49 as Needs Care', () => {
    render(
      <ul>
        <PokemonCard
          pokemon={bulbasaur}
          pet={{ health: 100, hunger: 50, happiness: 20 }}
          onSelect={vi.fn()}
        />
      </ul>,
    );

    expect(screen.getByText('Needs Care')).toBeInTheDocument();
    expect(screen.getByText(/Needs attention/)).toBeInTheDocument();
  });

  it('labels values from 50 through 69 as Needs Attention', () => {
    render(
      <ul>
        <PokemonCard
          pokemon={bulbasaur}
          pet={{ health: 100, hunger: 50, happiness: 80 }}
          onSelect={vi.fn()}
        />
      </ul>,
    );

    expect(screen.getByText('Needs Attention')).toBeInTheDocument();
    expect(screen.getByText('Needs food')).toBeInTheDocument();
  });

  it('shows an inactive Return Required card and confirms permanent return', () => {
    const onPermanentReturn = vi.fn();
    render(
      <ul>
        <PokemonCard
          pokemon={bulbasaur}
          pet={{ health: 0, hunger: 0, happiness: 0 }}
          onSelect={vi.fn()}
          onPermanentReturn={onPermanentReturn}
        />
      </ul>,
    );

    expect(screen.getByText('Return Required')).toBeInTheDocument();
    expect(screen.getByText('Bulbasaur can no longer stay in the lobby.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Select bulbasaur' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Return Bulbasaur' }));
    expect(screen.getByRole('heading', { name: 'Return Bulbasaur?' })).toBeInTheDocument();
    expect(screen.getByText(/Once returned, you will not be able to adopt Bulbasaur again/))
      .toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onPermanentReturn).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Return Bulbasaur' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm return Bulbasaur' }));

    expect(onPermanentReturn).toHaveBeenCalledExactlyOnceWith(bulbasaur);
  });
});
