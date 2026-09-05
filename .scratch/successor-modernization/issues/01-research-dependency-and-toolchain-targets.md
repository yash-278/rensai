> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Research current dependency and toolchain targets

Type: research
Status: superseded — historical reference only
Blocked by:

## Question

What current supported versions should each active workspace, runtime, build tool, and direct dependency target; which inherited packages or lockfile importers should be removed or replaced; what breaking migrations and compatibility constraints exist; and what evidence-backed upgrade order can reach a current foundation without treating literal latest-version chasing as the goal?

## Comments

- Claimed on 2026-08-29 for the `research/dependency-toolchain` worktree.
- Research asset: [`dependency-toolchain-targets.md`](../research/dependency-toolchain-targets.md).

## Answer

Target a current-supported baseline of Node 24 LTS, pnpm 11, Electron 44, electron-vite 5 with Vite 7, TypeScript 6, React 19, Biome 2, Tailwind 4, and the maintained current lines of retained runtime/UI packages. Defer Vite 8, TypeScript 7, pnpm 12, and TanStack Table 9 until their compatibility and maturity justify isolated upgrades.

Before version migration, make the graph truthful: keep one root lockfile, remove deleted documentation importers and the nested desktop lockfile, correct dependency ownership, remove unused packages, and delete the dependency trees for online sources, executable plugins, trackers, Discord, updater, and public docs. Replace archived Recoil rather than retaining it.

The evidence-backed order is behavior baseline, dependency-graph cleanup, deferred-capability removal, renderer-boundary hardening, development-toolchain upgrades, staged Electron/build-tool upgrades, persistence/state replacement, React/router upgrades, UI/Tailwind upgrades, retained runtime-package updates, and final clean attestation. Completion requires a frozen clean install, build/typecheck/lint/package success, a working offline macOS arm64 package, zero critical/high production advisories, and no unexplained critical/high result in the full audit.
