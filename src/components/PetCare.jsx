export default function PetCare({ pet, onInteract }) {
  return (
    <section className="pet-care" aria-labelledby="pet-care-title">
      <h2 id="pet-care-title">Care for your Pokémon</h2>
      <p className="care-description">Keep your companion feeling good. Higher hunger means better fed.</p>
      <div className="pet-status-grid" aria-live="polite" aria-atomic="true">
        {[
          ['health', 'Health'],
          ['hunger', 'Hunger'],
          ['happiness', 'Happiness'],
        ].map(([key, label]) => (
          <div className="pet-indicator" key={key}>
            <div className="pet-indicator-label"><span>{label}</span><strong>{pet[key]}/100</strong></div>
            <meter aria-label={label} min="0" max="100" value={pet[key]} />
          </div>
        ))}
      </div>
      {pet.hunger < 30 && <p className="hunger-warning" role="status">Needs food — a snack would help.</p>}
      <div className="care-actions">
        <div>
          <button className="lobby-button" type="button" onClick={() => onInteract('feed')}>Feed</button>
          <p>Hunger +25 · Happiness +5</p>
        </div>
        <div>
          <button className="lobby-button" type="button" onClick={() => onInteract('water')}>Give Water</button>
          <p>Health +10 · Hunger +5</p>
        </div>
        <div>
          <button className="lobby-button" type="button" onClick={() => onInteract('play')}>Play</button>
          <p>Happiness +25 · Hunger −5</p>
        </div>
      </div>
    </section>
  );
}
