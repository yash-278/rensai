> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Prototype the target modernization architecture

Type: prototype
Status: superseded — historical reference only
Blocked by: 06, 07, 08

## Question

What concrete target architecture and staged migration sequence reconciles the chosen dependency baseline, Electron security boundary, persistence model, and incremental-modernization constraint without leaving an unsafe or unusable intermediate application?

## Comments

- The architecture prototype must turn the researched order into reversible slices with explicit green checkpoints and prove the selected SQLite binding in a packaged macOS arm64 application before it becomes architectural fact.
- Architecture asset: [`target-modernization-architecture.md`](../research/target-modernization-architecture.md).
- Throwaway logic prototype: branch `prototype/modernization-architecture`, commit `d388d72`, `apps/desktop/prototypes/modernization-architecture.html`. Do not merge the HTML shell into implementation.

## Answer

Use a sandboxed React/Jotai renderer, a context-isolated typed preload, and a main application layer that owns SQLite repositories, source grants, bounded ingestion, reader sessions/page tokens, backup/import/export, and Electron security policy. The renderer has no Node, Electron, SQL, path, shell, or network authority.

Implement through green reversible slices: freeze behavior/release safety; remove deferred capabilities and clean the graph; introduce successor domain/repository ports; atomically flip the Electron boundary; upgrade the supported toolchain/Electron through packaged checkpoints; prove one SQLite binding on the exact Electron 44/macOS arm64 package; cut durable features vertically without dual writes; replace Recoil with Jotai before React/router/Tailwind modernization; then run final attestation.

The prototype validates four invariants: preserve the complete Local Content journey at every checkpoint, keep release blocked until final attestation, forbid the privilege flip before typed ports exist, and stop/reopen the decision if SQLite proof fails. A failed slice rolls back to the last green checkpoint; schema rollback uses the pre-migration snapshot plus the prior binary.

`better-sqlite3` remains a selected candidate—not architectural fact—until the packaged proof slice passes. RAR/CBR and any ingestion-limit widening remain similarly gated.
