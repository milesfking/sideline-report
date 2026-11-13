# Sideline Report

Mobile-first Sleeper fantasy football app that ranks players from **root for** to **root against** based on your leagues, weekly opponents, and how much you care about each league.

Enter a Sleeper username → set league interest → scroll a field of starters for the current kickoff batch (or the full week).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Sleeper API (rosters, matchups, players)
- ESPN public scoreboard (weekly kickoffs / live status)

No API keys required for local use. Sleeper’s API is free for non-commercial use.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local Next.js server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run test:rooting` | Rooting algorithm checks |

## Notes

- Player metadata is cached under `.cache/` locally (gitignored).
- League care + username persist in `localStorage` (`sideline-report-v1`).
