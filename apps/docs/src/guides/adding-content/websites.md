---
description: Set up Rensai Sources, find website series, and configure source settings.
---

# Website sources

Rensai Sources supplies the website sources shown in **Add Series**. It is the only website-source provider used by Rensai. Your local collection uses the separate **filesystem** source.

## Set up Rensai Sources

Website sources currently require a local development build of Rensai Sources. They are not distributed through a public plugin installer yet.

Follow the [local provider setup](https://github.com/yash-278/houdoku/blob/rensai-source-provider/docs/local-source-provider.md) to build and load the provider. In a configured development checkout, `pnpm --filter @houdoku/desktop dev:sources` starts the app with the built sibling provider. An explicit `RENSAI_SOURCES_PATH` can point to another provider build directory.

Open **Extensions** to check the provider status. A loaded provider shows its version and source count. If it cannot load, this page reports the error; local files remain available.

## Import a series

1. Open **Add Series** and choose a website from the source dropdown.
2. Search for a series and select it.
3. Review its details and add it to your library.
4. Open the series from **Library** to browse its chapters.

## Source settings

Open **Extensions** and select **Settings** beside Rensai Sources. Available settings depend on the source.

After rebuilding or changing the provider, select **Reload Sources**. Use **Refresh Status** to check which build is loaded.

## If a source does not work

A source in the list is not a guarantee that its website is reachable. Websites can change, restrict access, or go offline.

Check the provider status first. If it is loaded but one website fails, try opening that website in your browser and check the [project issues](https://github.com/yash-278/houdoku/issues) for reported problems. Include the source name and the failed action when reporting an issue. Do not include account details or private library data.

To save available chapters ahead of time, see [Offline downloads](../offline-download).
