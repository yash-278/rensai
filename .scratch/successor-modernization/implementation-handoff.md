> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Rensai Modernization Baseline implementation handoff

Prepared: 2026-08-29  
Status: superseded — historical reference only

## Objective

Build a usable offline macOS arm64 Rensai Personal Alpha on a current supported foundation, with a sandboxed Electron boundary, main-owned SQLite data, bounded Local Content ingestion, verified backup/import/recovery, and no executable/network integrations. Product Roadmap work begins only after the final completion attestation passes.

## Canonical decisions

| Area | Decision source |
|---|---|
| Product language | [`CONTEXT.md`](../../CONTEXT.md) |
| Identity and visual direction | [`issues/04-prototype-successor-identity-and-lineage.md`](issues/04-prototype-successor-identity-and-lineage.md) |
| Inherited behavior/data | [`research/inherited-behavior-and-data-baseline.md`](research/inherited-behavior-and-data-baseline.md) |
| Personal Alpha product contract | [`research/personal-alpha-contract.md`](research/personal-alpha-contract.md) |
| Dependency targets | [`research/dependency-toolchain-targets.md`](research/dependency-toolchain-targets.md) |
| Dependency/advisory policy | [`research/dependency-and-vulnerability-policy.md`](research/dependency-and-vulnerability-policy.md) |
| Electron/ingestion boundary | [`research/electron-and-local-content-security-boundary.md`](research/electron-and-local-content-security-boundary.md) |
| Persistence/state | [`research/persistence-and-state-contract.md`](research/persistence-and-state-contract.md) |
| Staged architecture | [`research/target-modernization-architecture.md`](research/target-modernization-architecture.md) |
| Final gates | [`research/modernization-baseline-completion-gates.md`](research/modernization-baseline-completion-gates.md) |

## Execution order

1. Remove deferred capabilities and make the active dependency graph truthful.
2. Introduce successor domain types and repository/use-case ports around the still-working Local Content journey.
3. Move privileged operations to main and atomically flip the Electron boundary.
4. Upgrade the supported toolchain and Electron through green packaged checkpoints.
5. Prove one SQLite binding in the exact macOS arm64 package.
6. Cut durable features vertically to SQLite, snapshots/export, and backup-only Houdoku replacement import without dual writes.
7. Replace Recoil with Jotai, then upgrade React/router/UI/Tailwind while preserving Sequence and reader behavior.
8. Run the complete final attestation.

## First implementation slice

Start with the local-only graph cleanup. Produce an inventory mapping every renderer route, main handler, package, and lockfile path for Extensions/Online Sources, tracker, Discord, updater, telemetry, remote cover/download, old docs workspace, spoof window, and Node polyfills to deletion or temporary Local Content retention. Then remove one capability cluster at a time behind the inherited fixture/smoke checkpoint.

Do not begin SQLite schema work, React/Tailwind redesign, or roadmap features in this slice. Keep release blocked.

## Conditional implementation proofs

- `better-sqlite3` must pass the exact packaged Electron 44/macOS arm64 proof before it becomes architectural fact; `node:sqlite` is the ordered gated fallback.
- RAR/CBR remains unsupported unless one maintained parser passes the same hostile-corpus gate as ZIP/CBZ.
- Houdoku compatibility is synthetic-fixture-backed until Yash explicitly provides a redacted backup. Do not imply full profile migration.

## Definition of done

The implementation is done only when every gate in the completion specification passes against the same clean commit and artifact, Yash completes the bounded manual UAT, and the final attestation has no active exception. Public publishing remains a separate later decision.
