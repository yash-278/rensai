# Rensai website

The Rensai landing page and reader guides use VitePress. The homepage implements the approved Sequence prototype from `prototype/successor-identity` at `f643c92`. Its campaign image is served as a 117 KB WebP, and the library preview uses the inherited desktop screenshots.

## Local development

Use the repository's pinned pnpm 9.0.0 and run from the repository root:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @houdoku/docs dev
```

The workspace keeps its existing `@houdoku/docs` package name to avoid changing the desktop or workspace dependency graph.

## Production preview

```sh
corepack pnpm --filter @houdoku/docs build
corepack pnpm --filter @houdoku/docs preview --port 4173
```

VitePress writes static HTML, CSS, JavaScript, search data, and a sitemap to `apps/docs/src/.vitepress/dist`. The build does not fetch releases or require API credentials. There is no application server or browser reader.

## Content

All inherited public page paths are retained:

- `/download` shows Rensai release availability, platform information, updates, and next steps. No Rensai releases were published when checked on 5 September 2026. Add verified Rensai assets here when released; do not use upstream Houdoku binaries.
- `/guides/getting-started` covers local imports, website sources, settings, integrations, and downloads.
- `/guides/adding-content/filesystem` preserves archive support, folder examples, refresh behavior, and chapter metadata parsing.
- `/guides/adding-content/websites` replaces the old plugin installation flow with the current Rensai Sources development setup.
- `/guides/customize`, `/guides/offline-download`, and `/guides/trackers` retain the inherited feature instructions.
- `/about` contains project links, screenshot attribution, and the original MIT license link.

The source guide describes the `rensai-source-provider` integration branch. Merge the website alongside that integration when preparing the product branch. The website itself does not depend on the provider at build time.

## Hosting later

The intended canonical URL is `https://rensai.yashkadam.com`, configured in `.vitepress/config.mts` for page metadata and the sitemap. Deployment and DNS changes are separate work.

Vercel supports VitePress directly. The website build command is `corepack pnpm --filter @houdoku/docs build`, run from the repository root, and the output directory is `apps/docs/src/.vitepress/dist`. Serve clean URLs so `/download` resolves to `download.html`, and use `404.html` for missing pages. The same static output can be served on Railway.

## Review

Check the homepage in light and dark themes, theme persistence across navigation and reload, the guide search, content tabs, mobile navigation, and direct loads of every guide URL. Keep the original Houdoku license unchanged.
