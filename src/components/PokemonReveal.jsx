function formatName(name) {
  const displayName = name.replaceAll('-', ' ');
  return displayName.charAt(0).toUpperCase() + displayName.slice(1);
}

export default function PokemonReveal({ pokemon, onAdopt, onSkip }) {
  const displayName = formatName(pokemon.name);

  return (
    <section className="pokemon-reveal" aria-labelledby="reveal-title">
      <p className="eyebrow">A new friend appeared</p>
      <h3 id="reveal-title">You found {displayName}!</h3>
      {pokemon.image ? (
        <img src={pokemon.image} alt={displayName} />
      ) : (
        <div className="missing-artwork">
          <span className="pokeball fallback-ball" aria-hidden="true" />
          <span>Artwork unavailable</span>
        </div>
      )}
      <div className="reveal-actions">
        <button className="lobby-button" type="button" onClick={onAdopt}>Adopt {displayName}</button>
        <button className="secondary-button" type="button" onClick={onSkip}>Skip {displayName}</button>
      </div>
    </section>
  );
}
