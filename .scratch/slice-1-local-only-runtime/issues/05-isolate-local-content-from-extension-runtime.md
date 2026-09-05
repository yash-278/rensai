> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# 05 — Isolate Local Content from the Extension runtime

**What to build:** Expand a temporary first-party Local Content adapter beside the inherited Extension runtime, then move the complete local import, refresh, library, archive, and reader path onto it. This makes Local Content independently verifiable before the executable Extension system is contracted away.

**Blocked by:** 03 — Remove remote chapter downloads; 04 — Remove remote artwork while preserving local covers.

**Status:** superseded

- [ ] Local folder/archive discovery, series metadata, chapter discovery, and page enumeration are available through one temporary first-party Local Content adapter.
- [ ] Local import, refresh/relink, library navigation, and reader page loading no longer require plugin-manager lookup, reload, settings, or discovery.
- [ ] The adapter owns only Local Content behavior and cannot resolve or dispatch an Online Source.
- [ ] Existing inherited source/domain types may remain behind the adapter, but no new UI or use case imports them directly.
- [ ] The temporary boundary is documented as a bridge to the successor-owned ports in Slice 2, not as the final domain API.
- [ ] During this expand step, the old Extension form may coexist only to keep the application green until ticket 06 contracts it.
- [ ] The offline Local Content checkpoint proves folder, ZIP, and CBZ behavior through the new adapter with networking denied.
- [ ] Frozen installation, lint, explicit desktop typecheck baseline, and desktop production build pass.
