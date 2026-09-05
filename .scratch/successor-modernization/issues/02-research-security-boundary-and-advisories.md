> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Research the inherited security boundary and advisory remediation

Type: research
Status: superseded — historical reference only
Blocked by:

## Question

What concrete attack surfaces and known advisories exist in the inherited Electron, renderer, IPC, filesystem, navigation, updater, archive, and executable-plugin paths; which are reachable in the Local Content Personal Alpha; and what remediation baseline would satisfy current Electron guidance without carrying obsolete compatibility shims?

## Comments

- Claimed on 2026-08-29 for the `research/security-boundary` worktree.
- Research asset: [`security-boundary-and-advisories.md`](../research/security-boundary-and-advisories.md).

## Answer

The inherited security model is not an acceptable feature-development base. The renderer currently has Node privileges without context isolation or sandboxing; broad IPC accepts renderer-controlled paths; the `atom://` handler is an arbitrary-path broker; navigation/external opening is insufficiently constrained; archive and filesystem traversal are unbounded; and runtime-installed packages execute in the main process.

The Personal Alpha must delete executable plugin installation/loading and remove online sources, trackers, Discord, updater, telemetry, and required network paths from the active product. Local folder/archive behavior becomes a first-party module with successor-owned domain types. The target boundary is a Node-free sandboxed renderer, context isolation, a narrow typed preload API, validated sender/origin/payloads, main-owned opaque file capabilities, safe custom protocols, deny-by-default navigation/permissions/network, production CSP, bounded archive ingestion, schema-validated legacy imports, and no automatic discovery or execution of legacy plugins.

Dependency upgrades remain mandatory but are insufficient by themselves. Security acceptance must assert the runtime window flags and exposed API, reject unexpected frames/origins/paths/URLs and malformed inputs, exercise a hostile archive corpus, prove safe legacy-data handling, and reach zero known production advisories with no unreviewed high/critical advisory in the full graph.
