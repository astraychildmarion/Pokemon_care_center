# Pokémon Care Lobby

Pokémon Care Lobby is a small virtual pet game built with React and the
[PokéAPI](https://pokeapi.co/). It started as a Pokémon pet shop concept and
gradually evolved into a care-based game where players adopt Pokémon, monitor
their health, hunger, and happiness, and respond to their changing needs.

## Why I built this

This project grew out of teaching material I created when I worked as a
part-time programming instructor, where I used Pokémon-themed exercises to help
beginners get familiar with front-end development.

For this version, I used my original teaching material as the starting point and
worked with Codex to develop it into a complete application. Instead of building
everything at once, I broke the work into small stages and used a **TDD (Red →
Green → Refactor)** approach throughout the development process.

I defined and iterated on the concept, game rules, user flows, interaction
design, visual direction, technical constraints, and testing requirements, while
using Codex to support the implementation.

## What you can do

- Draw a random Pokémon and choose whether to adopt or skip it.
- Care for adopted Pokémon by feeding them, giving them water, and playing with
  them directly from the lobby.
- Track health, hunger, happiness, and the overall condition of the lobby.
- Choose how quickly care values change with four game-speed settings.
- Open a Pokémon's detail view to see its Pokédex information, abilities, base
  stats, and available cry.
- Respond to random care events and return Pokémon when you need to make room.
- Continue from the same lobby after refreshing the page.

The lobby holds up to ten Pokémon. Care values move through five states: Doing
Well, Needs Attention, Needs Care, Emergency, and Return Required. A Pokémon only
reaches Return Required when health, hunger, and happiness have all fallen to
zero. Once returned in that state, it cannot be drawn again.

## Built with

- React
- Vite
- PokéAPI
- Vitest and React Testing Library
- CSS
- localStorage

The app uses native Fetch for API requests. Pokémon and care state live in the
top-level React application state, while small utility modules handle care
rules, draw eligibility, persistence, and the global lobby condition.

## Run locally

Use Node.js 22.20 or newer. The included `.nvmrc` can select the expected version
when using nvm.

```sh
nvm use
npm install
npm run dev
```

Vite will print the local development URL in the terminal.

## Tests and production build

```sh
npm run test:run
npm run build
```

Use `npm test` to run Vitest in watch mode.

The tests cover the care rules, drawing and adoption, timers, persistence,
keyboard interaction, accessible names, API transformation, error states, and
the permanent-return flow. API and timer behavior is controlled in tests, so the
suite does not depend on live PokéAPI requests or real-time waiting.

## Project structure

```text
src/
├── components/   Reusable lobby, care, detail, and feedback UI
├── services/     PokéAPI requests and response transformation
├── utils/        Care rules, drawing, speed settings, and persistence
├── App.jsx       Application state and main user flows
└── App.css       Responsive layout and visual design
```

Pokémon data and artwork are provided by
[PokéAPI](https://pokeapi.co/).
