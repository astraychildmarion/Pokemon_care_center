import { GAME_SPEEDS } from '../utils/gameSpeed';

export default function GameSpeedControl({ value, onChange }) {
  const selectedSpeed = GAME_SPEEDS[value];

  return (
    <div className="game-speed-control">
      <label htmlFor="game-speed">Game speed</label>
      <select
        id="game-speed"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {Object.entries(GAME_SPEEDS).map(([key, speed]) => (
          <option key={key} value={key}>
            {speed.label} — every {speed.seconds} seconds
          </option>
        ))}
      </select>
      <p>{selectedSpeed.label} — needs change every {selectedSpeed.seconds} seconds</p>
    </div>
  );
}
