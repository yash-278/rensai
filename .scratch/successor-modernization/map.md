> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Map: Define the successor Modernization Baseline

Label: wayfinder:map
Status: superseded — historical reference only

## Destination

Produce an implementation-ready modernization specification for the separately named Houdoku successor: a usable macOS arm64 Personal Alpha with current supported dependencies, cleared known security vulnerabilities, a hardened Electron boundary, durable user-owned data, and verified core journeys. Reaching this destination clears the way for implementation; feature-roadmap work begins only after the resulting Modernization Baseline is executed and achieved.

## Notes

- This map is planning-only. It resolves decisions and produces the implementation handoff; it does not implement the modernization.
- Use `wayfinder` for map sessions, `grilling` plus `domain-modeling` for HITL decisions, `research` for external facts, and `prototype` for identity or architecture artifacts.
- Canonical product language lives in [`CONTEXT.md`](../../CONTEXT.md).
- The product is a separately named open-source Successor that credits Houdoku and owns its roadmap; it does not promise permanent drop-in compatibility.
- The Personal Alpha is for Yash, validated on macOS arm64, and limited to Local Content. Core reading must work offline.
- The dependency and vulnerability baseline is a hard gate. Do not preserve old packages merely to minimize change, and do not silently suppress advisories.
- The inherited library-to-reader journey should remain recognizable. Broad redesign, online sources, extensions, trackers, telemetry, public binaries, and the Product Roadmap are outside this effort.
- Automatic publishing has already been changed from push-triggered to manual on the local `revival-bootstrap` branch. Treat that as completed foundation, not a map ticket.

## Decisions so far

- [`Prototype the successor identity and Houdoku lineage`](issues/04-prototype-successor-identity-and-lineage.md): use Rensai with the Sequence visual direction, a separate application identity and data profile, reader-first public copy, concise Houdoku attribution, and detailed technical or migration context outside the landing-page flow.
- [`Capture the inherited behavior and data-format baseline`](issues/11-capture-inherited-behavior-and-data-baseline.md): Houdoku uses unversioned string-valued renderer storage and a partial additive series/chapter restore; preserve validated Local Content, categories, and chapter read state through a dedicated importer while skipping executable/network/credential/cache state. Exact-page progress does not exist in the legacy format.
- [`Define the Personal Alpha product contract`](issues/05-define-personal-alpha-contract.md): ship an offline macOS arm64 local reader for folders and ZIP/CBZ with the inherited library and three-mode reader journey, new durable exact-page resume, replace-with-snapshot restore/import, bounded ingestion, and explicit exclusion of network/executable/public-distribution surfaces. RAR/CBR remains conditional on passing the same safety gate.
- [`Define dependency currency and vulnerability policy`](issues/06-define-dependency-and-vulnerability-policy.md): “up to speed” means maintained, supported, compatible, reproducible, and minimal rather than blindly newest. Require zero known production advisories at every severity, zero high/critical and no unreviewed findings in the full graph, and explicit time-boxed approval only for non-reachable moderate/low development exceptions.
- [`Choose the Electron and Extension security boundary`](issues/07-choose-electron-and-extension-security-boundary.md): one sandboxed Node-free window, runtime-validated typed preload capabilities, main-owned opaque source grants, expiring pathless page tokens, deny-by-default navigation/permissions/network, bounded isolated archive jobs, and deletion—not dormant retention—of executable/network integration code. RAR/CBR must pass the ZIP-equivalent safety gate or remain unsupported.
- [`Choose the persistence and state model`](issues/08-choose-persistence-and-state-model.md): main-owned `better-sqlite3` behind repository ports with exact packaged proof and ordered `node:sqlite` fallback; a separate Rensai data profile; normalized durable exact-page progress; transactional migrations/import/restore; consistent daily/safety snapshots and versioned exports; explicit backup-only Houdoku replacement import; final Jotai UI state with no Recoil, dual writes, or normal browser persistence.
- [`Prototype the target modernization architecture`](issues/09-prototype-target-modernization-architecture.md): preserve a green Local Content checkpoint through local-only graph cleanup, domain ports, an atomic Electron security flip, supported runtime/tool upgrades, exact packaged SQLite proof, vertical durable-data cutover, Jotai/React/UI modernization, and final attestation. Release stays blocked throughout; failed slices restore the last green code/data checkpoint.
- [`Define Modernization Baseline completion gates`](issues/10-define-modernization-completion-gates.md): require one clean commit/artifact to pass identity/scope, frozen supported dependencies and advisory policy, automated verification, packaged Electron boundary, bounded hostile ingestion, SQLite/migration/recovery, Houdoku import, full offline reader/library, macOS arm64 lifecycle, documentation, manual UAT, package inventory, and final no-exception attestation before Product Roadmap work unlocks.
- [`Research current dependency and toolchain targets`](issues/01-research-dependency-and-toolchain-targets.md): target a current-supported Node 24/pnpm 11/Electron 44/electron-vite 5/Vite 7/TypeScript 6/React 19/Biome 2/Tailwind 4 baseline; prune the graph and deferred capabilities first; require reproducible macOS arm64 and advisory gates.
- [`Research the inherited security boundary and advisory remediation`](issues/02-research-security-boundary-and-advisories.md): the inherited privileged renderer, broad IPC/path broker, executable plugin system, and unbounded local-input paths are a pre-roadmap blocker; the Personal Alpha requires a sandboxed Node-free renderer, typed capabilities, bounded ingestion, and removal of deferred network/executable surfaces.
- [`Research persistence and state modernization options`](issues/03-research-persistence-and-state-options.md): make main-process SQLite the sole durable source of truth, use safe snapshots plus versioned exports and a legacy importer, and replace transitional Recoil with Jotai after repository cutover; prove the binding against the exact Electron/macOS arm64 package.

## Implementation handoff

- Canonical handoff: [`implementation-handoff.md`](implementation-handoff.md).
- Ready implementation spec: [`Complete Slice 1: local-only runtime and dependency graph`](issues/12-complete-slice-1-local-only-runtime-graph.md) (`ready-for-agent`).
- Execution sequence: local-only graph cleanup; domain/repository ports; atomic Electron security flip; supported toolchain/Electron checkpoints; packaged SQLite proof; vertical durable-data cutover; Jotai/React/UI modernization; final attestation.
- Conditional proofs remain bounded: SQLite binding package proof, RAR/CBR safety inclusion, and any future real redacted Houdoku backup fixture.
- Product Roadmap work remains blocked until the executed Modernization Baseline passes ticket 10. The planning map itself is complete.

## Out of scope

- The post-modernization Product Roadmap and new feature prioritization.
- Online Sources, executable Extensions, trackers, Discord integration, accounts, telemetry, or required background network traffic.
- Public binaries, updater manifests, Apple signing/notarization, or Windows/Linux release promises.
- The inherited public documentation website and a broad product-experience redesign.
- A rewrite undertaken without evidence that incremental modernization cannot reach the destination.
