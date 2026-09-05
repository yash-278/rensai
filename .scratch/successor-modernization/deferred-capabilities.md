> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Rensai deferred-capabilities register

Updated: 2026-08-29  
Status: superseded — historical reference only

This is the canonical list of product capabilities removed from the inherited Houdoku runtime during the Rensai Modernization Baseline. **Removed means deferred from the Personal Alpha, not permanently rejected.** Git preserves the inherited implementation, but reintroduction should be designed against Rensai's current architecture rather than restored wholesale.

Update this register whenever another user-visible capability is removed. Record the owning code/dependencies in the implementation diff or progress log; keep this document focused on product intent and re-entry conditions.

## Deferred capabilities

| Capability | Personal Alpha state | Why the inherited implementation was removed | Reintroduction gate |
|---|---|---|---|
| Automatic application updates | Deferred | It used Houdoku's upstream product/release identity and an inherited vulnerable updater chain. Rensai has no approved public distribution channel yet. | Rensai-owned release repository and update endpoint; signed and notarized artifacts; protected release provenance; current audited updater; explicit opt-in/update policy; packaged upgrade and rollback tests. |
| Discord rich presence | Deferred | It is not required for local reading, creates background network activity, and carried an obsolete dependency tree. | Confirm user value; optional and disabled-by-default integration; current maintained SDK or narrow browser-safe protocol; no reading data shared without clear consent; offline behavior and disconnect handling tested. |
| Manga tracker integrations | Deferred | AniList, MyAnimeList, and MangaUpdates clients stored credentials in renderer persistence and performed network operations across the inherited unsafe boundary. Their dependency chain also carried known vulnerabilities. | Decide supported providers; optional integration boundary; credentials stored outside renderer/browser persistence; main-owned validated API; provider rate-limit/error handling; explicit mapping and conflict semantics; offline reading never blocked; security and privacy review. |

## Reintroduction rules

1. Reintroduce a capability only after the Modernization Baseline is complete unless it becomes essential to the agreed core reader contract.
2. Treat the inherited code as behavioral reference, not as an implementation to copy back unchanged.
3. Add each capability as an optional vertical slice with its own tests, dependency audit, privacy behavior, failure handling, and user-facing controls.
4. Preserve offline local reading when an integration is unavailable, unauthenticated, rate-limited, or disabled.
5. Record the decision here when a capability is scheduled, redesigned, restored, replaced, or permanently declined.
