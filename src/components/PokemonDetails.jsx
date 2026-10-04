import { useEffect, useRef, useState } from 'react';
import PetCare from './PetCare';
import PokemonCry from './PokemonCry';
import RandomPetEvent from './RandomPetEvent';
import { isReturnRequired } from '../utils/petState';

export default function PokemonDetails({
  pokemon,
  onBack,
  pet,
  onInteract,
  onRandomEvent,
  onReturn,
  onPermanentReturn,
}) {
  const headingRef = useRef(null);
  const returnButtonRef = useRef(null);
  const restoreReturnFocusRef = useRef(false);
  const [failedImageUrl, setFailedImageUrl] = useState(null);
  const [confirmingReturn, setConfirmingReturn] = useState(false);
  const displayName = pokemon.name.replaceAll('-', ' ');
  const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
  const hasArtwork = pokemon.image && pokemon.image !== failedImageUrl;
  const returnRequired = pet ? isReturnRequired(pet) : false;

  useEffect(() => {
    headingRef.current.focus();
  }, [pokemon.id]);

  useEffect(() => {
    if (!confirmingReturn && restoreReturnFocusRef.current) {
      returnButtonRef.current?.focus();
      restoreReturnFocusRef.current = false;
    }
  }, [confirmingReturn]);

  return (
    <section className="pokemon-details" aria-labelledby="pokemon-detail-title">
      <button className="back-button" type="button" onClick={onBack}>
        <span aria-hidden="true">←</span> Back to lobby
      </button>
      <div className="details-grid">
        <div className="details-art">
          <span className="details-number">#{String(pokemon.id).padStart(3, '0')}</span>
          {hasArtwork ? (
            <img src={pokemon.image} alt={displayName} onError={() => setFailedImageUrl(pokemon.image)} />
          ) : (
            <div className="missing-artwork">
              <span className="pokeball fallback-ball" aria-hidden="true" />
              <span>Artwork unavailable</span>
            </div>
          )}
        </div>
        <div className="details-information">
          <p className="eyebrow">Meet your new friend</p>
          <h1 id="pokemon-detail-title" className="pokemon-name" ref={headingRef} tabIndex={-1}>{displayName}</h1>
          <div className="type-badges">
            {pokemon.types.map((type) => <span className="type-badge" key={type}>{type}</span>)}
          </div>
          <PokemonCry key={pokemon.cry ?? 'unavailable'} cry={pokemon.cry} />
          <dl className="pokemon-dimensions">
            <div><dt>Height</dt><dd>{pokemon.height} m</dd></div>
            <div><dt>Weight</dt><dd>{pokemon.weight} kg</dd></div>
          </dl>
          <h2 id="abilities-title">Abilities</h2>
          <ul className="ability-list" aria-labelledby="abilities-title" role="list">
            {pokemon.abilities.map((ability) => (
              <li className="pokemon-name" key={ability}>{ability.replaceAll('-', ' ')}</li>
            ))}
          </ul>
        </div>
      </div>
      {onRandomEvent && !returnRequired && (
        <RandomPetEvent pokemonName={pokemon.name} onEvent={onRandomEvent} />
      )}
      {pet && !returnRequired && (
        <PetCare pet={pet} pokemonName={formattedName} onInteract={onInteract} />
      )}
      <div className="details-stats">
        <h2 id="stats-title">Base stats</h2>
        <p className="stats-description">A quick look at this Pokémon’s strengths.</p>
        <ul className="stat-list" aria-labelledby="stats-title" role="list">
          {pokemon.stats.map((stat) => (
            <li key={stat.name}>
              <span className="pokemon-name">{stat.name === 'hp' ? 'HP' : stat.name.replaceAll('-', ' ')}</span>
              <strong>{stat.value}</strong>
            </li>
          ))}
        </ul>
      </div>
      {returnRequired && onPermanentReturn ? (
        <section className="return-pokemon return-required" aria-labelledby="return-section-title">
          {!confirmingReturn ? (
            <>
              <h2 id="return-section-title">Return Required</h2>
              <p>{formattedName} can no longer stay in your lobby.</p>
              <button
                ref={returnButtonRef}
                className="return-button"
                type="button"
                onClick={() => setConfirmingReturn(true)}
              >Return {formattedName}</button>
            </>
          ) : (
            <div className="return-confirmation">
              <h2 id="return-section-title">Return {formattedName}?</h2>
              <p>
                {formattedName} can no longer stay in your lobby. Once returned, you will not be
                able to adopt {formattedName} again.
              </p>
              <div className="return-actions">
                <button
                  className="secondary-button"
                  type="button"
                  autoFocus
                  onClick={() => {
                    restoreReturnFocusRef.current = true;
                    setConfirmingReturn(false);
                  }}
                >Cancel</button>
                <button
                  aria-label={`Confirm return ${formattedName}`}
                  className="confirm-return-button"
                  type="button"
                  onClick={() => onPermanentReturn(pokemon)}
                >Return {formattedName}</button>
              </div>
            </div>
          )}
        </section>
      ) : onReturn && (
        <section className="return-pokemon" aria-labelledby="return-section-title">
          {!confirmingReturn ? (
            <>
              <h2 id="return-section-title">Need to make space?</h2>
              <p>Return this Pokémon to free one place in your lobby.</p>
              <button
                ref={returnButtonRef}
                className="return-button"
                type="button"
                onClick={() => setConfirmingReturn(true)}
              >Return Pokémon</button>
            </>
          ) : (
            <div className="return-confirmation">
              <h2 id="return-section-title">Return {formattedName}?</h2>
              <p>{formattedName} will leave your lobby and free one space.</p>
              <div className="return-actions">
                <button
                  className="secondary-button"
                  type="button"
                  autoFocus
                  onClick={() => {
                    restoreReturnFocusRef.current = true;
                    setConfirmingReturn(false);
                  }}
                >Cancel</button>
                <button className="confirm-return-button" type="button" onClick={() => onReturn(pokemon)}>
                  Return {formattedName}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </section>
  );
}
