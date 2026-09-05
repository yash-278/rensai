> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Define the Personal Alpha product contract

Type: grilling
Status: superseded — historical reference only
Blocked by: 11

## Question

What exact Local Content formats, library operations, reader behaviors, progress semantics, settings, backup/restore behavior, offline guarantees, and inherited-data compatibility constitute the Personal Alpha; and which inherited capabilities are explicitly absent rather than accidentally broken?

## Comments

- Research leaves explicit product decisions for exact-page resume, replace versus separately named merge/import behavior, supported archive formats, and finite archive size/count/depth/time limits.
- Product contract: [`personal-alpha-contract.md`](../research/personal-alpha-contract.md).

## Answer

Rensai Personal Alpha is a Yash-only, offline-capable macOS arm64 reader for user-owned folders and ZIP/CBZ archives containing PNG/JPEG/WebP pages. It preserves the recognizable library and reader journey: single/multi-series import, editable metadata, categories, search/sort/filter, read/unread state, refresh/relink/remove-without-source-deletion, Single/Double/Long Strip, RTL/LTR, spread rules, fit controls, keyboard/click navigation, and adjacent chapters.

Add durable exact-page resume as successor behavior while retaining explicit chapter read state and the inherited 80% auto-completion intent. Restore and Houdoku import are validated replacement operations with a pre-operation SQLite snapshot, not implicit additive merges. The dedicated importer preserves validated Local Content IDs, categories, and chapter read state; maps allowlisted preferences; recomputes unread counts; and reports/drops deferred data without network access.

Folders and ZIP/CBZ are mandatory. RAR/CBR is included only if a maintained extractor passes the same bounded hostile-corpus gate; otherwise it is explicitly deferred with a clear error. Enforce documented depth, count, size, expansion-ratio, image, and time limits with cancellation and no partial mutation.

Online Sources, executable Extensions, trackers/tokens, remote downloads/covers, Discord, telemetry, accounts/sync, automatic updates, public binaries, signing/notarization, Windows/Linux support, and a web reader are explicitly absent rather than accidentally broken.
