# Rensai website

The Rensai landing page and reader guides use VitePress. The homepage implements the approved Sequence prototype from `prototype/successor-identity` at `f643c92`. Its campaign image is served as a 117 KB WebP, and the library preview uses captures of the current production Library, sidebar, and title bar with fictional sample titles.

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

## Railway deployment

The canonical URL is `https://rensai.yashkadam.com`. VitePress uses it for metadata and the sitemap.

Railway builds `apps/docs/Dockerfile` from the repository root. The service's Dockerfile path is `apps/docs/Dockerfile`, its health check is `/` with a 60-second timeout, and it runs one replica. Railway's live API no longer accepts the old `railway.json` config-file setting, so these values are configured directly on the service. The build uses Node 24 and the repository-pinned pnpm 9.0.0. Only the docs workspace and its build inputs enter the Docker context. The runtime image serves the generated files with Caddy, with no database, desktop dependencies, or Node process.

`apps/docs/Caddyfile` serves clean URLs, compresses responses, caches versioned assets, and returns the generated error page with HTTP 404. Railway terminates HTTPS and forwards requests to the container's `PORT`, defaulting to 8080 for local runs. The health check requests `/` before a deployment receives traffic.

To build and run the production image locally:

```sh
docker build -f apps/docs/Dockerfile -t rensai-website .
docker run --rm -p 8080:8080 rensai-website
```

The Railway service tracks the `rensai` branch of `yash-278/rensai`. Watch patterns cover `/apps/docs/**`, `/package.json`, `/pnpm-lock.yaml`, `/pnpm-workspace.yaml`, `/patches/**`, and `/LICENSE.txt`. Only changes to these website build inputs trigger a deployment.

Railway bills for runtime resources and bandwidth. One replica serves the static site. The downloadable build archive is optional and is not used by Railway.

## Review

Check the homepage in light and dark themes, theme persistence across navigation and reload, the guide search, content tabs, mobile navigation, and direct loads of every guide URL. Keep the original Houdoku license unchanged.

## Refresh the library screenshots

The capture uses the real desktop dashboard and Library components, a fictional library, and a disposable Electron profile with network requests blocked. It captures both themes at 1440 × 900 without touching user data.

```sh
pnpm --filter @houdoku/desktop design:build
pnpm --filter @houdoku/desktop exec electron design-system/capture-website.cjs
```

The command prints its temporary output directory. Convert `library-dark.png` and `library-light.png` from that directory with `cwebp -q 90 -m 6`, saving them as `src/public/rensai-library-dark.webp` and `src/public/rensai-library-light.webp` in the docs workspace. Keep the homepage's dimensions and sample-content caption accurate.
