# Rensai: preserve features, unblock development

Confirmed by Yash: 2026-09-04

## Current decision

Every feature in the shared Houdoku application remains in scope and should work as it does in the inherited product. Fix issues that demonstrably block new development; do not shrink the product to make modernization easier.

This replaces the local-only Personal Alpha scope, feature-removal plan, eight-slice modernization prerequisite, and associated implementation tickets. They remain historical reference, not an active execution queue.

## Feature-preservation contract

- Preserve the library, reader modes/navigation, local folders and archives, metadata/categories, read state, backup/restore, Online Sources and Extensions, remote chapter downloads, local/remote artwork, manga trackers, Discord presence, and automatic-update capability.
- Preserve feature behavior, not unsafe implementation details. Security repairs, dependency updates, and internal refactoring must keep the capability usable and include proportionate regression checks.
- Existing third-party service or compatibility failures are defects/blockers to investigate, not permission to remove the integration. Distinguish source presence, locally verified behavior, and provider-dependent behavior that remains unverified.
- If a feature cannot safely be kept working without a materially different product choice, explain the evidence and ask Yash; do not silently disable it or mark it deferred.
- Keep Rensai/Sequence and reader-first public copy as retained identity decisions. A landing/docs site is not a web reader and is not a prerequisite to blocker repairs.

## What to change

1. Establish the inherited feature and developer-workflow baseline without merging the removal experiment.
2. Identify concrete install/build/typecheck/dev-runtime failures, broken feature paths, incompatible or unmaintained dependencies, and security issues that block safe development.
3. For each proposed fix, record the observed failure, affected workflow/features, smallest sufficient repair, and regression evidence.
4. Make targeted compatible upgrades and repairs. Do not retain obsolete packages by default, but do not force every newest major or a stack migration without a blocker that justifies it.
5. Unblock new development incrementally. SQLite, Jotai, a full Electron rewrite, and the former final attestation are not blanket prerequisites; reconsider them only against demonstrated needs.

## Preservation and safety

- The feature-preserving checkout remains on `revival-bootstrap`; no removal implementation was merged into it.
- Recovered removal source changes and original planning are archived locally on `implementation/local-only-graph`, commit `f68b148`, in a permanent sibling worktree.
- The original temporary worktree was gone. All five recorded source-edit batches were recovered, but its generated root lockfile was not. The archive documents this gap and is not the exact formerly tested build.
- Existing committed research and prototype branches are preserved. No push, deployment, or public release is authorized by this scope change.
- Retaining automatic updates does not authorize shipping or trusting Houdoku's upstream release identity as Rensai. Repair identity/channel safety when relevant, without deleting the capability. The existing manual-only publishing guard remains.

## Next action

The first compiler blocker is fixed and pushed on `revival-bootstrap` at `aaacf5e`. The superseded local-only tickets must not be picked up.

Yash confirmed that Rensai Sources is the only website-source provider. Do not support, install, update, load, or fall back to the original provider. Keep the filesystem source for local folders and archives. The current local branches are `rensai-source-provider` in this checkout and `rensai-provider` in the sibling `rensai-sources` checkout. Preserve inherited source IDs and application features. Confirm local provider loading before choosing and fixing websites one at a time. This supersedes both the earlier preference against owning website-specific maintenance and the temporary plan to run both providers.

The local integration is described in `docs/local-source-provider.md`. No website-specific changes, public package publication, or new push are part of this setup.
