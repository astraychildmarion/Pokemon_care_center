import { useEffect, useState } from 'react';
import { getCareLevel, updatePetState } from '../utils/petState';
import CareActions from './CareActions';

const CARE_LEVEL_LABELS = {
  'doing-well': 'Doing well',
  'needs-attention': 'Needs Attention',
  'needs-care': 'Needs Care',
  emergency: 'Emergency',
  'return-required': 'Return Required',
};

export default function PokemonCard({
  pokemon,
  pet,
  onSelect,
  onInteract,
  onPermanentReturn,
  isSelected = false,
}) {
  const [failedImageUrl, setFailedImageUrl] = useState(null);
  const [confirmingReturn, setConfirmingReturn] = useState(false);
  const [careFeedback, setCareFeedback] = useState(null);
  const displayName = pokemon.name.replaceAll('-', ' ');
  const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
  const hasArtwork = pokemon.image && pokemon.image !== failedImageUrl;
  const careLevel = pet ? getCareLevel(pet) : null;
  const returnRequired = careLevel === 'return-required';
  const careNeeds = pet ? [
    pet.health < 70 && 'Needs rest',
    pet.hunger < 70 && 'Needs food',
    pet.happiness < 70 && 'Needs attention',
  ].filter(Boolean) : [];

  useEffect(() => {
    if (!careFeedback) return undefined;
    const timerId = setTimeout(() => setCareFeedback(null), 900);
    return () => clearTimeout(timerId);
  }, [careFeedback]);

  function handleCareAction(action) {
    const nextPet = updatePetState(pet, action);
    const deltas = Object.fromEntries(
      ['health', 'hunger', 'happiness']
        .map((metric) => [metric, nextPet[metric] - pet[metric]])
        .filter(([, amount]) => amount !== 0),
    );
    setCareFeedback({ action, deltas });
    onInteract(action);
  }

  return (
    <li className={`pokemon-card${isSelected ? ' is-selected' : ''}${careLevel ? ` care-${careLevel}` : ''}`}>
      <div className={`card-art${careFeedback ? ` reaction-${careFeedback.action}` : ''}`}>
        <span className="spot-number">#{String(pokemon.id).padStart(3, '0')}</span>
        {hasArtwork ? (
          <img
            className="pokemon-artwork"
            src={pokemon.image}
            alt={displayName}
            loading="lazy"
            onError={() => setFailedImageUrl(pokemon.image)}
          />
        ) : (
          <div className="missing-artwork">
            <span className="pokeball fallback-ball" aria-hidden="true" />
            <span>Artwork unavailable</span>
          </div>
        )}
      </div>
      <div className="card-content">
        <span className="card-label">{isSelected ? 'Selected' : 'A new friend'}</span>
        <h3 className="pokemon-name">{displayName}</h3>
        <div className="type-badges">
          {pokemon.types.map((type) => <span className="type-badge" key={type}>{type}</span>)}
        </div>
        {pet && (
          <div className="card-care" aria-live="polite">
            <p className="card-care-level">{CARE_LEVEL_LABELS[careLevel]}</p>
            <div className="card-status-list">
              {[
                ['health', 'Health'],
                ['hunger', 'Hunger'],
                ['happiness', 'Happiness'],
              ].map(([key, label]) => (
                <div className="card-status" key={key}>
                  <span>
                    <span>{label}</span>
                    <strong>
                      {pet[key]}
                      {careFeedback?.deltas[key] && (
                        <span className="care-value-feedback">
                          {careFeedback.deltas[key] > 0 ? '+' : '−'}
                          {Math.abs(careFeedback.deltas[key])}
                        </span>
                      )}
                    </strong>
                  </span>
                  <meter
                    aria-label={`${displayName} ${label.toLowerCase()}`}
                    min="0"
                    max="100"
                    value={pet[key]}
                  />
                </div>
              ))}
            </div>
            {!returnRequired && onInteract && (
              <CareActions pokemonName={formattedName} onInteract={handleCareAction} />
            )}
            {returnRequired ? (
              <p className="card-return-message">{formattedName} can no longer stay in the lobby.</p>
            ) : careNeeds.length > 0 && (
              <p className="card-care-needs">{careNeeds.join(' · ')}</p>
            )}
          </div>
        )}
        {returnRequired ? (
          <div className="card-return">
            {!confirmingReturn ? (
              <button className="return-button" type="button" onClick={() => setConfirmingReturn(true)}>
                Return {formattedName}
              </button>
            ) : (
              <div className="card-return-confirmation">
                <h4>Return {formattedName}?</h4>
                <p>
                  {formattedName} can no longer stay in your lobby. Once returned, you will not be
                  able to adopt {formattedName} again.
                </p>
                <div className="return-actions">
                  <button className="secondary-button" type="button" onClick={() => setConfirmingReturn(false)}>
                    Cancel
                  </button>
                  <button
                    aria-label={`Confirm return ${formattedName}`}
                    className="confirm-return-button"
                    type="button"
                    onClick={() => onPermanentReturn?.(pokemon)}
                  >Return {formattedName}</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            className="card-select-button"
            type="button"
            aria-label={`See ${formattedName} status`}
            onClick={(event) => {
              event.currentTarget.focus();
              onSelect(pokemon);
            }}
          >
            <span>See <span className="pokemon-name">{displayName}</span> status</span>
            <span aria-hidden="true">↗</span>
          </button>
        )}
      </div>
    </li>
  );
}
