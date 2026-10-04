import { useId } from 'react';
import { CARE_ACTIONS, CARE_METRIC_LABELS } from '../utils/petState';

function signedValue(value) {
  return value > 0 ? `+${value}` : `−${Math.abs(value)}`;
}

export function careActionName(action, pokemonName) {
  if (action === 'feed') return `Feed ${pokemonName}`;
  if (action === 'water') return `Give ${pokemonName} water`;
  return `Play with ${pokemonName}`;
}

export function careEffectText(action) {
  return Object.entries(CARE_ACTIONS[action].effects)
    .map(([metric, value]) => `${CARE_METRIC_LABELS[metric]} ${signedValue(value)}`)
    .join(' · ');
}

export default function CareActions({
  pokemonName,
  onInteract,
  disabledActions = {},
  size = 'compact',
}) {
  const idPrefix = useId();

  return (
    <div className={`care-action-list care-action-list-${size}`} aria-label={`Care for ${pokemonName}`} role="group">
      {Object.entries(CARE_ACTIONS).map(([action, details]) => {
        const tooltipId = `${idPrefix}-${action}`;
        const accessibleName = careActionName(action, pokemonName);
        const disabledReason = disabledActions[action];
        return (
          <div className="care-action-control" key={action}>
            <button
              className="care-action-button"
              type="button"
              aria-label={accessibleName}
              aria-describedby={tooltipId}
              disabled={Boolean(disabledReason)}
              onClick={() => onInteract(action)}
            >
              <span className="care-action-icon" aria-hidden="true">{details.icon}</span>
              <span className="care-action-label">{details.label}</span>
            </button>
            <span className="care-action-tooltip" id={tooltipId} role="tooltip">
              <strong>{accessibleName}</strong>
              <span>{disabledReason || careEffectText(action)}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
