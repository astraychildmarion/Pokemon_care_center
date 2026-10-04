import { useEffect, useRef, useState } from 'react';

const MIN_EVENT_DELAY = 45_000;
const EVENT_DELAY_RANGE = 30_000;

const EVENTS = [
  { id: 'hungry', message: (name) => `${name} is feeling hungry.` },
  { id: 'wants-play', message: (name) => `${name} wants to play.` },
  { id: 'tired', message: (name) => `${name} feels tired.` },
  { id: 'needs-attention', message: (name) => `${name} needs a little attention.` },
];

function formatName(name) {
  const displayName = name.replaceAll('-', ' ');
  return displayName.charAt(0).toUpperCase() + displayName.slice(1);
}

export default function RandomPetEvent({ pokemonName, onEvent, random = Math.random }) {
  const [currentEvent, setCurrentEvent] = useState(null);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    let timerId;

    function scheduleNextEvent() {
      const delay = MIN_EVENT_DELAY + Math.floor(random() * EVENT_DELAY_RANGE);
      timerId = setTimeout(() => {
        const eventIndex = Math.min(Math.floor(random() * EVENTS.length), EVENTS.length - 1);
        const event = EVENTS[eventIndex];
        setCurrentEvent(event);
        onEventRef.current(event.id);
        scheduleNextEvent();
      }, delay);
    }

    scheduleNextEvent();
    return () => clearTimeout(timerId);
  }, [pokemonName, random]);

  if (!currentEvent) return null;

  return (
    <div className="random-event" role="status">
      <div>
        <strong>Something happened</strong>
        <p>{currentEvent.message(formatName(pokemonName))}</p>
      </div>
      <button type="button" onClick={() => setCurrentEvent(null)}>Dismiss event</button>
    </div>
  );
}
