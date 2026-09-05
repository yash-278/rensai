> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Define Modernization Baseline completion gates

Type: grilling
Status: superseded — historical reference only
Blocked by: 04, 05, 06, 07, 08, 09

## Question

What automated checks, macOS arm64 runtime scenarios, data-integrity proofs, security checks, dependency/advisory results, documentation, and explicit exclusions must pass before the Modernization Baseline is complete and Product Roadmap work may begin?

## Comments

- Include runtime Electron-boundary assertions, hostile path/archive/backup cases, one canonical frozen lockfile, production and full-graph advisory policy, offline packaged core journeys, data migration/backup/restore integrity, and a packaged-dependency inventory.
- Acceptance specification: [`modernization-baseline-completion-gates.md`](../research/modernization-baseline-completion-gates.md).
- Implementation handoff: [`../implementation-handoff.md`](../implementation-handoff.md).

## Answer

The Modernization Baseline completes only when identity/scope, reproducible dependencies, automated verification, Electron runtime security, bounded ingestion, SQLite/recovery, Houdoku import, the full offline library/reader journey, packaged macOS arm64 behavior, documentation, and one final attestation all pass against the same clean commit and artifact.

Require zero known production advisories at every severity, zero high/critical and no unreviewed full-graph finding, one root frozen lockfile, one packaged SQLite binding, no active exception, no Recoil/browser persistence/dual writes, runtime proof of the sandboxed typed boundary, exact limit/escape tests for hostile paths/archives/backups, transactional import/restore with verified snapshots, and package inventory proving excluded capabilities absent.

Yash owns the bounded final manual UAT on the packaged offline macOS arm64 build. Public publishing, signing/notarization, updater, and general distribution remain disabled/out of scope even after the Personal Alpha baseline passes. Any failed gate keeps the baseline open and Product Roadmap work blocked.
