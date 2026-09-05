# Rensai design foundations

The neutral charcoal, cool white, and blue direction is approved. The token foundation is implemented, and Add Series is the first production page migrated.

## Review the design

From the repository root:

```sh
pnpm --filter @houdoku/desktop design:preview
```

Open the localhost URL printed by Vite. The preview uses the actual shared components and token stylesheet, with fictional series and no Electron IPC or source requests. Try light/dark, comfortable/compact, filters, search, details, and adding a sample series. The Foundations and Components views expose the visual rules and states.

Open `/search.html` on the same server to review the production Add Series component. It uses an offline IPC fixture, fictional covers, and an in-memory import queue. The sidebar is illustrative. It never connects to a source, opens a database, or imports into the user's library.

```sh
pnpm --filter @houdoku/desktop design:check
pnpm --filter @houdoku/desktop check-types
pnpm --filter @houdoku/desktop build
```

The design check builds the preview and renders it in a hidden Electron window with a disposable profile. It writes captures and contrast results to the OS temporary directory under `rensai-design-review`, or to `DESIGN_CHECK_OUTPUT` when supplied. It never opens the application profile.

## Direction

Use three distinct surfaces for the canvas, content panels, and overlays. Keep artwork's colors separate from the application's action and status colors. Dark mode uses a charcoal canvas, lighter panels, pale text, and a light blue action color. Light mode uses a cool white canvas, white panels, dark text, and a deeper blue action color.

Inter is bundled locally. Body text is 14 px with 1.5 line height; captions are 12 px, section headings 18 px, and page headings 24 px. Titles belong beneath cover images. Do not make text smaller to fit more artwork.

Spacing uses a 4 px base with 4, 8, 12, 16, 24, and 32 px steps. Controls use 6 px corners; panels use 10 px. Comfortable controls are 36 px tall and compact controls are 32 px. Density changes control geometry while retaining text size. Cover density is a separate page concern.

Use primary buttons for the main action, outlined or secondary buttons for supporting actions, and text with status colors for feedback. States must have words or icons as well as color. Labels stay outside inputs. Keyboard focus uses a two-pixel ring and offset. Controls use 120 ms color transitions; token-driven motion is disabled for reduced-motion preferences.

## Public interface

Import one stylesheet and one preset:

```css
@import '@houdoku/ui/tokens.css';
```

```js
module.exports = {
  presets: [require('@houdoku/ui/tailwind-preset')],
  content: [/* application and shared component paths */],
};
```

Existing component imports, props, and semantic color names remain supported:

```tsx
<section className="space-y-section bg-background text-foreground">
  <h1 className="text-page-title">Add series</h1>
  <Input aria-label="Search titles" />
  <Button>Add to library</Button>
  <Badge variant="success">In library</Badge>
</section>
```

The document root's existing `.dark` class selects the dark theme. The optional root attribute `data-density="compact"` selects compact controls. Keep appearance attributes on the root so Radix portals inherit them. Comfortable is the production default; a persisted density preference has not been added to Settings.

The source of truth is `packages/ui/src/styles/tokens.css`. It contains palette/scales, semantic roles, and shared component measurements. `packages/ui/tailwind-preset.cjs` maps those roles into utilities. New component styles consume semantic roles; raw palette values are reserved for token definitions and fictional preview artwork.

## Architecture comparison

We applied the comparison process from [design-an-interface](https://www.skills.sh/mattpocock/skills/design-an-interface) to the token/component interface, and used the design-system and frontend-design skills for the visual implementation.

**CSS-first.** A stylesheet and Tailwind preset hide theme values and mappings. Existing component callers remain unchanged. It fits the current single application and introduces no runtime theme provider. CSS references need rendering checks because TypeScript cannot validate them. This is the selected approach.

**Typed catalogue.** A typed token definition could generate CSS and the preset, providing checked references and exports for other consumers. It also creates generation and drift checks to maintain. No second consumer or external token-export requirement currently justifies that machinery.

**Component recipes.** Shared Page, Toolbar, Panel, and Text wrappers could make consistent composition easier. They also enlarge the React API before the page designs have established useful defaults. We adopted consistent control recipes now; shared page wrappers can emerge from the Add Series migration.

## Implemented scope

- Shared light/dark tokens, type and spacing scales, radii, motion, and density measurements.
- Shared Tailwind mappings, including semantic text styles and status colors.
- Button, Input, Select trigger, Badge, and Card adoption. Existing Radix interactions remain in place.
- Desktop theme import and removal of the conflicting Arial body declaration.
- An isolated interactive preview and rendered checks.
- Production Add Series with independent adaptive cover density, titles beneath covers, existing-library badges, and keyboard-accessible result cards.
- Source-specific filters apply immediately for selections. Text filters wait 400 ms after typing stops; Enter applies immediately. Reset restores defaults and refreshes immediately. Closing the panel does not discard changes. The side panel appears at widths of at least 1200 px, with a drawer on smaller windows. All nine filter types remain supported. Tag controls show ignored, included, and excluded states explicitly.
- Existing results remain visible during refresh, with a small loading indicator. New filter edits supersede pending responses, including during the text debounce. Reset and source changes cancel pending timers. The main title search remains submitted with Search or Enter.
- The Add Series dialog keeps its header and action buttons outside the scrollable details area. Long descriptions scroll within a multiline field, tags wrap within the content width, and the cover stacks above metadata in narrow windows. Rendered checks cover long metadata at desktop, 640 x 420, and 360 x 420 window sizes.
- Search submission without page reload, pagination using the submitted query, stale-response protection, and visible source/detail failures with retry. Single-series and multi-series local imports retain their existing flow.

Shared styling affects existing pages immediately. Pages other than Add Series retain their current layout. Unmigrated hardcoded page styles, animations, and one-off components will be reviewed as each page moves to the foundation; this is not a claim of a complete accessibility audit.

## Page rollout

1. Visual direction approved.
2. Add Series migrated. Cover density is independent of the Library column preference and lasts for the application session. It is separate from the global control-density tokens.
3. Library: reuse proven series presentation with reading progress and library actions.
4. Series details and chapters, then Downloads, Sources, and Settings.

Each page should use the foundation, retain its existing capabilities, and receive focused interaction and visual checks before moving to the next page.

## Verification

The desktop build and type checks, preview type check and build, and targeted component lint passed. The rendered check passed light/dark switching, text contrast of at least 4.5:1 for the tested semantic pairs, input-border and focus-ring contrast of at least 3:1, 36/32 px density, visible input focus, sample detail/add interactions, and a 640 px layout without horizontal overflow. Screenshots were inspected after theme transitions settled.

The production-page fixture checks adaptive covers, titles beneath artwork, independent Library density, immediate selections, debounced text filters, Enter/Reset cancellation, closing the drawer during a pending update, tag exclusion, form submission, pagination retaining the submitted query, source error/retry and empty states, stale source/detail responses, the selected series entering the import queue, a narrow filter drawer, and single/multi-series local selection. These checks use synthetic IPC responses. They do not validate live website compatibility or database import completion.
