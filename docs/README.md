# Hacado documentation

Product documentation for Hacado, built with [Next.js](https://nextjs.org/) and [Nextra](https://nextra.site/).

## Scripts

From this directory:

```bash
yarn dev
yarn build
yarn start
```

The dev server uses port `3003`.

## Content

- Guides live under `content/` and are served at `/docs/...`.
- Sidebar order is set in each folder’s `_meta.ts`.
- Images and the favicon live in `public/`.
- The homepage is `app/page.tsx`.

Existing public URLs such as `/docs/apps/google-calendar` stay in place. `/docs/daily-use/first-steps-after-setup` redirects to `/docs/first-steps`.

`patches/nextra-theme-docs+4.6.1.patch` fixes a Nextra 4.6.1 bug where the docs layout drops its `children` prop before validating props, which otherwise crashes every guide page.
