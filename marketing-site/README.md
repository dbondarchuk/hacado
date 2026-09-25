# Hacado marketing site

Content and scripts that generate page-builder JSON and seed it into an organization. Not a Vite/React app — the live site is the seeded pages on Hacado.

## Layout

- `src/content/` — copy and data
- `src/blocks/` — page-builder block factories (`core`, `primitives`, `layout`, `media`, `heroes`, `widgets`)
- `src/pages/` — page trees (`home`, `features`, `use-cases`, `compare`, `seo`, `site`, `chrome`)
- `scripts/` — `generate` / `seed` CLI (writes gitignored `scripts/structure/`)
- `public/assets/` — images/videos uploaded on seed

## Scripts

```bash
cd marketing-site
yarn install
yarn generate          # writes scripts/structure/*.json (gitignored)
yarn seed <org-slug>   # upload assets + upsert pages (uses repo /.env)
```

Optional flags (see `scripts/seed.mjs`): `--generate`, `--yes`, `--env-file=../.env`.

Signup/login URLs in content point at `https://app.hacado.com`. See [BLOCK_MAP.md](./BLOCK_MAP.md) for page-builder mapping.
