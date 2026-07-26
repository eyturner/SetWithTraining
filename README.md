# Set with Training

![Logo](https://i.imgur.com/YTldFYX.png)

This is a solo-practice fork of [Set with Friends](https://setwithfriends.com/),
a browser implementation of the real-time card game
[Set](<https://en.wikipedia.org/wiki/Set_(card_game)>). Your goal is to find
triplets of cards that follow a certain pattern as quickly as possible.

The original project is an online multiplayer game backed by Firebase. This
fork strips out all of the networking — there's no server, no accounts, and no
multiplayer — and turns it into a self-contained, offline-capable trainer for
getting faster at spotting Sets by yourself. All game state and stats live in
your browser's `localStorage`.

- [Original project](https://setwithfriends.com/) (online multiplayer version)

## Training Mode

In addition to the regular solo game, the lobby has a **Training Mode** panel
with a few focused drills:

- **Find the Third** — you're shown two cards and have 60 seconds to decide
  whether a third card exists that completes a Set with them (and if so,
  identify it). Builds the pattern-matching reflex needed to spot the
  "conjugate" card quickly.
- **Find All Sets** — given a 12-card board, find every Set on it before
  moving to the next board, across 5 boards. Builds board-scanning speed and
  thoroughness.
- **Practice Hard Boards** — a spaced-repetition queue (Leitner system) of
  boards you were slow to solve during a regular game. Whenever a Set takes
  longer than your configured "slow-set threshold" to find, that board gets
  queued up for review at increasing intervals (10 min, 1 hour, 1 day, 3 days,
  1 week) so you drill your actual weak spots instead of random boards.

Every solo game also keeps a **Set Log** showing each Set you found and how
long it took, and records stats (rounds played, accuracy, best/average time)
per training type so you can track improvement over time.

## Technical Details

The frontend is built with [React](https://reactjs.org/), with components from
[Material UI](https://material-ui.com/), and is written in JavaScript in the
`src/` folder. There is no backend: game state, training queues, and stats are
persisted entirely client-side via `localStorage`.

The latest development version of the code is on the `main` branch.

## Development

Since there's no backend, getting set up is simple:

- Install Node 20 and npm 10.
- Run `npm install` in the root folder to get dependencies.
- Run `npm run dev` to start the Vite dev server.

The site can be opened at `http://localhost:5173`. Changes to code in `src`
are reflected immediately.

Other useful commands:

```bash
npm run lint
npm test

# Bundle the application into static assets.
npm run build
npm run preview

# Format the codebase with Prettier.
npm run format
```

Note: this repo still carries some unused scaffolding from the original
Firebase-backed project (the `functions/` folder, `firebase.json`,
`rundev.js`, and a few unreferenced pages/components under `src/`) that
predates the removal of the networking layer and isn't needed to build or run
the app.

## Deployment

Since the app is now a static frontend with no backend, `npm run build`
produces a fully self-contained `dist/` folder that can be hosted anywhere
that serves static files (Netlify, Vercel, GitHub Pages, a plain S3 bucket,
etc.) — no database, functions, or environment-specific configuration
required.

## License

Originally built by [Eric Zhang](https://github.com/ekzhang) and
[Cynthia Du](https://github.com/cynthiakedu) as
[Set with Friends](https://setwithfriends.com/); this fork adapts their work
into an offline, solo training tool.

All source code is available under the [MIT License](LICENSE.txt). We are not
affiliated with _Set Enterprises, Inc._, or the SET® card game.
