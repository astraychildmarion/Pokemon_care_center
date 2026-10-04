import { useId } from 'react';
import { deriveLobbyCare } from '../utils/lobbyCare';

function pokemonCount(count) {
  return `${count} Pokémon`;
}

function problemSummary(entry) {
  const problems = entry.problems
    .map(({ label, value }) => `${label}: ${value}`)
    .join(', ');
  const stateLabel = {
    emergency: ' (Emergency)',
    'return-required': ' (Return Required)',
  }[entry.level] ?? '';
  return `${entry.name} — ${problems}${stateLabel}`;
}

export default function LobbyCareIndicator({ pokemon, petStates }) {
  const tooltipId = useId();
  const status = deriveLobbyCare(pokemon, petStates);
  const visibleLabel = status.level === 'empty' || status.level === 'doing-well'
    ? status.label
    : `${status.label} — ${pokemonCount(status.countAtWorstLevel)}`;

  return (
    <div className="lobby-care-wrapper">
      <div
        className={`lobby-care-indicator state-${status.level}`}
        role="status"
        tabIndex="0"
        aria-label={status.accessibleLabel}
        aria-describedby={tooltipId}
      >
        <span className="lobby-care-content" key={status.level}>
          <span className="lobby-care-dot" aria-hidden="true" />
          <span>{visibleLabel}</span>
        </span>
      </div>
      <div className="lobby-care-tooltip" id={tooltipId} role="tooltip">
        {status.level === 'empty' && <p>Adopt a Pokémon to start caring for your lobby.</p>}
        {status.level === 'doing-well' && <p>All adopted Pokémon are doing well.</p>}
        {status.pokemonNeedingCare.length > 0 && (
          <>
            <strong>Care required:</strong>
            <ul>
              {status.pokemonNeedingCare.map((entry) => (
                <li key={entry.id}>{problemSummary(entry)}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
