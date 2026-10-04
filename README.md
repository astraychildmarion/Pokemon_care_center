# Pokémon Virtual Lobby

A small React learning project evolving into a Pokémon care and adoption game.
The lobby now draws one random Pokémon on request from a predefined set of valid
PokéAPI IDs. A reveal asks the player to Adopt or Skip before the Pokémon can
enter the lobby. Adopted Pokémon still use normalized, real PokéAPI data.
Reusable cards support accessible selection and missing/broken artwork. Selecting
a card opens the existing Pokémon detail view with Back navigation.
The detail view now includes a virtual pet care panel with Feed, Give Water,
and Play interactions. Each Pokémon keeps its own pet values during the session.
Milestone 7 confirmed that Context is unnecessary. Milestone 8 adds deliberate
cry playback from the real Pokémon model.
Infrequent random events now give the active Pokémon simple care needs.
The lobby limits adoption to ten unique Pokémon and shows its current capacity.
Adopted cards now monitor care values and flag needs in text as well as styling.
A persistent lobby indicator derives the worst current care state and identifies
the Pokémon and metrics that need attention on hover or keyboard focus. One
lobby-wide timer applies status decay at the player's selected game speed.
Players can return an adopted Pokémon after confirmation to free capacity.
Adopted Pokémon and their care values persist across page refreshes.
If every care value reaches zero, the Pokémon must be permanently returned and
is excluded from future draws.

## Run locally

Use Node.js 22.20 or newer (with nvm, run `nvm use`).

```sh
npm install
npm run dev
```

Open the local URL printed by Vite.

## Check the project

```sh
npm run test:run
npm run build
```

`npm test` starts Vitest in watch mode.

## Structure

- `src/App.jsx`: semantic page layout, draw/reveal/adoption state, and gallery.
- `src/App.css`: responsive CSS Grid, page styling, and focus states.
- `src/main.jsx`: React entry point and Strict Mode.
- `src/App.test.jsx`: draw, reveal, skip, adoption, capacity, error, and detail tests.
- `src/components/PokemonReveal.jsx`: Adopt/Skip confirmation for a drawn Pokémon.
- `src/components/PokemonCard.jsx`: card presentation, image fallback, and selection callback.
- `src/components/PokemonCard.test.jsx`: supplied data, selection, and broken-artwork tests.
- `src/components/PokemonDetails.jsx`: details, care controls, Back navigation, and confirmed return UI.
- `src/components/PokemonDetails.test.jsx`: detail content, navigation, return confirmation, and fallbacks.
- `src/components/PokemonCry.jsx`: deliberate audio playback, status messages, and cleanup.
- `src/components/PokemonCry.test.jsx`: no autoplay, playback, replay, failures, and stopping on unmount.
- `src/components/RandomPetEvent.jsx`: infrequent event scheduling, feedback, and timer cleanup.
- `src/components/RandomPetEvent.test.jsx`: controlled event selection, timing, dismissal, and cleanup.
- `src/components/PetCare.jsx`: labeled pet meters, care buttons, and low-hunger warning.
- `src/components/PetCare.test.jsx`: visible indicators, action callbacks, and warning threshold tests.
- `src/components/LobbyCareIndicator.jsx`: derived lobby status and accessible care tooltip.
- `src/components/GameSpeedControl.jsx`: labeled Relaxed, Normal, Fast, and Challenge selector.
- `src/utils/petState.js`: initial pet values and simple, immutable interaction rules.
- `src/utils/petState.test.js`: interaction effects and value limits.
- `src/utils/lobbyCare.js`: worst-state and care-problem derivation for the lobby indicator.
- `src/utils/lobbyCare.test.js`: global priority, empty state, and multiple-Pokémon tests.
- `src/utils/gameSpeed.js`: the four supported decay interval presets.
- `src/utils/pokemonDraw.js`: supported IDs, duplicate-safe selection, and capacity rules.
- `src/utils/pokemonDraw.test.js`: duplicate and maximum-capacity state tests.
- `src/utils/lobbyStorage.js`: validated localStorage loading and safe saving.
- `src/utils/lobbyStorage.test.js`: restoration and malformed-data fallback tests.
- `src/services/pokemonApi.js`: native Fetch requests and Pokémon response transformation.
- `src/services/pokemonApi.test.js`: mocked-network service tests and a small API fixture.
- `src/test/setup.js`: DOM matchers and cleanup between tests.
- `vite.config.js`: React and Vitest configuration.

Lobby state stays local in `App` with `useState`. Drawing chooses an ID that is
not already adopted and calls `fetchPokemonDetails`; the response remains pending
until the player chooses Adopt or Skip. No routing, Context, or additional
libraries are needed. `App` also owns the selected Pokémon; choosing an adopted
card opens its detail view without fetching again.

## Detail navigation

`PokemonDetails` receives `pokemon`, `onBack`, and optional `pet`, `onInteract`,
and `onReturn` props for care and adoption actions. It displays artwork, Pokédex
number, name, types, height in metres, weight in kilograms, abilities, and labeled
base stats. Missing or broken artwork has a visible fallback.

The selected Pokémon conditionally renders the detail view. While it is open,
the lobby is hidden with the native `hidden` attribute, preserving its cards,
capacity, and artwork state. Hidden controls are removed from keyboard and
screen-reader navigation. Back clears the selection and reveals the same lobby.
The detail heading receives focus on opening; Back restores focus to the original
card button. No new API request occurs when opening or leaving details.

## Pokémon cries

`PokemonCry` receives the model’s `cry` URL. Its native audio element uses
`preload="none"` and plays only after the user activates "Play Cry". The button
is disabled while starting or playing, then becomes available when the cry ends.
Loading, playing, and playback errors have readable status messages. A failed
attempt can be retried. Missing cry data disables playback with an explanation.

Leaving the detail view pauses audio and ignores late playback results. A new
cry URL remounts the control to reset its status. Tests mock native media methods;
they never download or play live audio. No audio library or Context was added.

## Virtual pet care

Pet health, hunger, and happiness are application state, separate from the API
model and Pokémon base stats. Each new pet starts with health 100, hunger 80, and
happiness 80. Hunger measures how well fed the Pokémon is, so a higher value is
better.

| Interaction | Effect |
| --- | --- |
| Feed | Hunger +25, happiness +5 |
| Give Water | Health +10, hunger +5 |
| Play | Happiness +25, hunger −5 |

Values stay within 0–100. Lobby cards show labeled native meters and visible
numbers for all three values. The lowest value determines the state: 70–100 is
"Doing Well", 50–69 is "Needs Attention", 20–49 is "Needs Care", and 0–19 is
"Emergency". Exactly zero for health, hunger, and happiness is "Return Required".
One or two zero values remain recoverable emergencies. Specific text such as
"Needs food" or "Needs attention" accompanies warning styling, and recovering
every metric to 70 removes it.
The detail panel also retains its focused low-hunger message. Care buttons show
their effects, support keyboard activation, and retain visible focus.

`App` owns `petStates`, keyed by Pokémon ID, and uses functional state updates
with the pure `updatePetState` helper. `PetCare` receives values and an interaction
callback through props. No Context is needed for this parent/child relationship.
Back navigation and switching Pokémon preserve each pet’s values without API
calls. Refreshing the page restores adopted Pokémon and their latest care state.

## Lobby care indicator and status decay

The sticky header indicator shows the worst current state across all adopted
Pokémon, with a neutral state for an empty lobby. Its label communicates the
state without relying on color. Hovering it or focusing it from the keyboard
opens a concise tooltip containing every Pokémon below Doing Well and only the
care metrics below 70. The state is derived directly from current pet values.
Its brief transition runs on state changes and is disabled when reduced motion
is preferred. Return Required has priority over Emergency and reuses the
strongest warning treatment.

Each decay tick decreases hunger and happiness by 10. Health remains stable
unless that tick leaves hunger below 20; emergency hunger then decreases health
by 10. Every value is clamped at zero. The speed selector offers:

| Mode | Interval |
| --- | --- |
| Relaxed | Every 15 seconds |
| Normal (default) | Every 10 seconds |
| Fast | Every 5 seconds |
| Challenge | Every 3 seconds |

`App` owns one interval for the whole lobby and updates every adopted Pokémon
through a functional state update. Adding a Pokémon or changing speed replaces
the interval through normal effect cleanup, and unmounting clears it. A speed
change preserves all state and starts a fresh interval without an immediate
decay. Cards, the header indicator, and an open detail view read the same state.
Refreshing does not simulate missed time.

## Returning Pokémon

The detail view offers Return Pokémon in a separate, clearly worded section.
Activating it first shows the Pokémon’s name, explains that one lobby space will
be freed, and requires Cancel or Return. Cancel keeps the Pokémon and restores
focus to the original action.

Confirming removes the Pokémon and its keyed care state, returns to the lobby,
updates capacity, stops tracking it in status decay, and focuses Draw Pokémon.
Its ID becomes eligible for a later draw. If adopted again, it receives fresh
initial care values rather than the previous state.

When all three care values reach zero, the card becomes inactive, its artwork
becomes grayscale, and its status changes to Return Required. Care controls and
random events are removed, while the care logic also rejects interaction and
decay updates for that Pokémon. The card remains visible until the player uses
its named Return action and confirms the permanent consequence.

A care-failure return removes the Pokémon, frees its lobby slot, and records its
ID in `returnedPokemonIds`. Permanently returned IDs are removed from the draw
candidate pool before random selection and cannot be adopted again. Voluntary
returns continue to work as before and remain eligible for a future draw.

## Persistence

The app saves adopted Pokémon, their keyed care state, and permanently returned
Pokémon IDs in localStorage.
A fresh mount restores the lobby without another PokéAPI request. Pending draws,
the open detail screen, random-event messages, and timer positions are temporary.

The storage utility validates the saved shape, removes duplicate entries, limits
restoration to ten Pokémon, and ignores invalid care values. Missing, malformed,
unavailable, or full storage falls back safely without preventing play. Returned
IDs take precedence over malformed active-lobby entries during restoration.
Restored values do not include offline decay; decay resumes from the saved values
only while the application is running.

## Random events

While a Pokémon’s detail view is open, one event is scheduled 45–75 seconds in
the future. Events remain deliberately small:

| Event | Effect |
| --- | --- |
| Feeling hungry | Hunger −15 |
| Wants to play | Happiness −10 |
| Feels tired | Health −5 |
| Needs attention | Happiness −5 |

The event appears as a dismissible status message and immediately updates the
same per-Pokémon pet state. Values remain within 0–100, and an event can trigger
the existing low-hunger warning. A single `setTimeout` schedules each event;
after firing, it schedules the next one. Leaving details clears the pending
timer, while the resulting pet state remains available for the session.

Tests use fake timers and controlled randomness, so automated runs are fast and
deterministic. There is no event history, offline simulation, or complex game
engine.

## Pokémon cards

`PokemonCard` takes `pokemon`, `pet`, `onSelect`, and optional `isSelected` props. It
renders a list item with artwork, Pokédex number, name, types, and a native
selection button. The button calls `onSelect(pokemon)`; its visible label includes
the Pokémon name, and native button behavior supports Enter and Space. Focus
styles and a text label identify the active selection without relying on colour.

The card does not fetch API data or own the selected Pokémon. Its only local
state records a failed artwork URL, allowing a visible fallback while keeping
selection available. A new image URL can display without an effect to reset
state. Missing images use the same fallback.

## Drawing and adoption

The lobby starts empty and never fetches automatically. Draw Pokémon selects one
ID from the supported set and fetches that Pokémon through the existing service.
The reveal does not change lobby state until Adopt is activated; Skip discards it.
Already adopted IDs are removed from the next draw's candidate set without retry
loops. Permanently returned IDs are excluded from the same derived candidate
pool. If no candidates remain, Draw Pokémon is disabled with a friendly status
message. Failed requests show an error and can be retried without adding a card.

The lobby contains at most ten Pokémon. The capacity rule is enforced in the
state helper as well as the disabled Draw control. At capacity, a readable status
explains that a Pokémon must be returned before drawing again.

## Pokémon service

`fetchPokemonDetails(idOrName)` requests the real
`https://pokeapi.co/api/v2/pokemon/{id or name}/` endpoint. Names are trimmed and
lowercased. It returns this internal model, keeping API response nesting out of
future presentation components:

```js
{
  id,        // number
  name,      // API name, e.g. 'bulbasaur'
  image,     // official artwork, default sprite fallback, or null
  types,     // array of type names
  height,    // metres
  weight,    // kilograms
  abilities, // array of ability names
  stats,     // array of { name, value } base stats
  cry,       // latest cry, legacy fallback, or null
}
```

Height and weight are converted from the units defined in the
[PokéAPI documentation](https://pokeapi.co/docs/v2#pokemon). Pet health, hunger,
and happiness are not part of this API model.

`fetchPokemonPage({ offset = 0 })` requests the Pokémon list with `limit=20`, then
fetches the listed Pokémon details. It returns `{ pokemon, nextOffset }`, where
`nextOffset` is `null` on the last page. Each page requests at most 20 details
concurrently. Presentation code never reads the raw list response.

The service caches response promises by request path in memory. Repeated calls
and simultaneous callers (including Strict Mode effect replays) share requests.
Successful responses remain available until a page refresh; failed requests are
removed so retry works. A partially failed page can reuse the list and successful
details on retry.

Unsuccessful HTTP responses throw an error, with a specific message for 404.
Network and JSON parsing errors propagate to the caller. The lobby catches these
errors and offers retry, retaining existing guests if a later page fails. The
load-more button is disabled during requests and disappears on the final page.
Automated tests mock the service or Fetch and never depend on the live API.

## Final review

Milestone 10 reviews the complete experience at desktop, tablet, and mobile
widths. Semantic landmarks, keyboard order, visible focus, focus transfer into
details and back to the originating card, readable status messages, image
fallbacks, labeled pet meters, and reduced-motion behavior are covered by the
implementation and focused behavior tests.
