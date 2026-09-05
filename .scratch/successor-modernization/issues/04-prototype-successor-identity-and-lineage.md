> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Prototype the successor identity and Houdoku lineage

Type: prototype
Status: superseded — historical reference only
Blocked by:

## Question

What separately owned product name, application identity, minimal visual direction, and lineage wording should the Successor use so it is clearly distinct while truthfully crediting Houdoku as its base across the README, About surface, license notices, repository metadata, and future distribution artifacts?

## Comments

- The identity prototype must also decide the new Electron application ID and user-data location. Legacy Houdoku profiles and plugin directories must never be discovered or executed automatically.
- Claimed on 2026-08-29 for this Wayfinder session.
- Prototype captured on branch `prototype/successor-identity` at commit `e58a8e2`.
- Reaction asset: [`successor-identity/index.html`](/private/tmp/houdoku-prototype-identity/apps/desktop/src/renderer/prototypes/successor-identity/index.html). The three working directions are Panelkeep, Yomu, and Inkrail; names remain unscreened candidates until Yash selects a direction worth validating.
- Awaiting Yash's live reaction. This HITL ticket remains claimed and must not be resolved until he chooses a direction or requests another round.
- Yash rejected all three first-round directions on 2026-08-29 and requested stronger names and prototypes.
- Round two replaces the marketing-page concepts with realistic desktop-library shells: Tsuzuku (continuity), Rensai (serialized catalog), and Panna (personal pages/local ownership). Captured on `prototype/successor-identity` at commit `5479772`; round one remains available at `e58a8e2`.
- Lightweight collision screening removed obvious active-reader conflicts from the candidate pool. The round-two names still require repository, package, domain, and trademark clearance after Yash identifies a preferred direction.
- Yash clarified on 2026-08-29 that the public surface should be a product landing page plus documentation, not a browser reader or a website that reproduces the desktop app. The app belongs on the page only as product proof and preview.
- Round three follows the useful information architecture of the existing Houdoku site—product proposition, desktop screenshot, features, documentation, and project links—while keeping Personal Alpha boundaries explicit. It does not promise public binaries, extensions, trackers, or a hosted catalog.
- Round-three candidates are Anukram (recommended; sequence/order/index), Rensai (serialization), and Panna (page/emerald). Tsuzuku was removed after the refreshed 2026 screen found current book- and anime-progress products using the name.
- Prototype and naming rationale captured on `prototype/successor-identity` at commit `07008b6`. Reaction asset: [`successor-identity/index.html`](/private/tmp/houdoku-prototype-identity/apps/desktop/src/renderer/prototypes/successor-identity/index.html); shortlist: [`naming-shortlist.md`](/private/tmp/houdoku-prototype-identity/apps/desktop/src/renderer/prototypes/successor-identity/naming-shortlist.md).
- Desktop and mobile browser verification passed for all three variants, URL state, keyboard switching, responsive layout, documentation preview, and the explicit site/app boundary. The HITL ticket remains claimed pending Yash's reaction.
- Yash rejected Hindi-derived product names and explicitly retained Rensai on 2026-08-29. Those candidates and their script artwork were removed from the live prototype and shortlist.
- Round four keeps Rensai as the anchor and replaces the comparison directions with Seihon (`製本`, bookbinding) and Sasshi (`冊子`, booklet/bound pages). Captured on `prototype/successor-identity` at commit `840602a`.
- Browser verification passed again after the replacement across all variants and the mobile layout. The ticket remains claimed: Rensai is retained, but the final product-name decision and whether either comparison survives are still open.
- Yash reconfirmed Rensai and rejected the round-four visual language on 2026-08-29. Seihon and Sasshi are removed from the live prototype; name comparison is closed in favor of Rensai, subject to formal clearance before public distribution.
- Round five is a full Rensai-only redesign using a near-black, chalk-white, and vermilion system; a chapter-frame wordmark motif; generated campaign media; and the real inherited Houdoku library screenshot. It removes the warm editorial styling, fake app UI, equal feature cards, decorative status labels, and name-based theme switching from prior rounds.
- The three reaction directions now isolate visual structure: Sequence, Stage, and Panels. Stage is the working recommendation because it gives the desktop product the clearest cinematic identity and makes the meaning of Rensai a memorable content beat.
- Desktop dark mode, desktop light mode, mobile layout, all generated and inherited assets, URL switching, keyboard switching, theme persistence, horizontal overflow, and reduced-motion CSS were verified. The HITL ticket remains claimed until Yash accepts a visual direction or requests another round.
- Round five is captured on `prototype/successor-identity` at commit `c16ca42`.
- Yash selected Sequence on 2026-08-29 and rejected the round-five copy because it presented an engineering modernization effort rather than a manga reader.
- Round six locks Sequence as the only live direction and removes the comparison switcher. Its public story is grounded in inherited reader behavior: single, double-page, and vertical styles; both reading directions; page fitting; keyboard navigation; local ZIP/RAR/CBZ/CBR content; unread filtering; and chapter completion. Houdoku appears only in the final About and footer attribution.
- Selected artifact captured on `prototype/successor-identity` at commit `f643c92`. Desktop dark, desktop light, and mobile browser verification passed with no console errors or horizontal overflow.

## Answer

Use **Rensai** as the successor name and **Sequence** as its visual direction. Use `io.github.yash278.rensai` and a separate Rensai user-data location; never discover or execute a Houdoku profile automatically. The landing page must market the reading experience first, with reader guides as the supporting public surface. Credit Houdoku once in a concise About section and preserve its original MIT license and copyright notices in the repository and distribution artifacts. Keep application identity, migration mechanics, security architecture, modernization policy, and detailed lineage in project or technical documentation rather than the reader-facing product story.
