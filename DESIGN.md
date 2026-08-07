# Design System — Dev Project Dashboard

This documents the design system as it actually exists in the codebase today (Phase 2), reverse-engineered from `tailwind.config.ts`, `src/app/globals.css`, and every component under `src/`. Where the code disagrees with itself, §9 says so explicitly rather than papering over it.

**Companion file:** `design-token-proof.html` — open it directly in a browser (no build step) to see every token below rendered live, including the two broken tokens from §9 shown as actual failures, not just descriptions of them.

---

## 1. Design philosophy

- **Single-user power tool, not a consumer product.** Dark mode only — there is no light theme, and none is planned. It's built to feel like a cockpit for one person (Porter), not a marketing surface for many.
- **OLED-first.** The canvas is true black (`#000000`), not a dark gray. Panels have to earn visual presence through glass and glow rather than through a lighter background step.
- **Glassmorphism as the surface language.** Elevation is expressed through layered translucency and blur, not through drop shadows or lightness alone.
- **Neon signal accents.** A small, saturated accent palette sits on top of the black/glass base and carries all semantic meaning — status, priority, activity type. Nothing else in the UI carries color.

---

## 2. Color

### 2.1 Base
| Token | Value | Usage |
|---|---|---|
| `background` | `#000000` | `<body>` background |
| `foreground` | `#ffffff` | Default text color |

### 2.2 Glass scale — surface elevation
Nine steps, `glass-100` → `glass-900`. This isn't a typical lightness-based gray scale: opacity and darkness move *together*. A higher step is a more opaque, darker layer, which is what reads as "closer to the viewer" against pure black — a low-opacity light gray would nearly disappear, while a high-opacity dark gray stands off the canvas clearly.

| Token | Value | Rendered weight |
|---|---|---|
| `glass-900` | `rgba(10, 10, 10, 0.9)` | Most solid — elevated cards |
| `glass-800` | `rgba(20, 20, 20, 0.8)` | Default card surface |
| `glass-700` | `rgba(30, 30, 30, 0.7)` | Hover state, default cards |
| `glass-600` | `rgba(40, 40, 40, 0.6)` | Hover state, liquid-glass buttons |
| `glass-500` | `rgba(60, 60, 60, 0.5)` | |
| `glass-400` | `rgba(80, 80, 80, 0.4)` | |
| `glass-300` | `rgba(100, 100, 100, 0.3)` | |
| `glass-200` | `rgba(120, 120, 120, 0.2)` | |
| `glass-100` | `rgba(140, 140, 140, 0.1)` | Faintest — barely-there tint |

Real surfaces pair a glass step with a Tailwind opacity modifier and a blur level — e.g. the base `.glass` utility is `bg-glass-800/50 backdrop-blur-xl`.

### 2.3 Accent palette
| Token | Hex | Used for |
|---|---|---|
| `accent-primary` | `#00d4ff` | Brand/interactive accent — links, primary buttons, default focus glow |
| `accent-purple` | `#8b5cf6` | Pull request activity |
| `accent-cyan` | `#06b6d4` | "Normal" priority, "create" activity, project-search focus glow |
| `accent-emerald` | `#10b981` | "Active" status, "push" activity |
| `accent-orange` | `#f59e0b` | "Paused" status |
| `accent-secondary` | `#ff2d55` | Defined in config. **Zero references anywhere in `src/`** — see §9.1 |

### 2.4 Borders
| Token | Value |
|---|---|
| `border-glass` | `rgba(255, 255, 255, 0.1)` |
| `border-glass-hover` | `rgba(255, 255, 255, 0.2)` |

### 2.5 Semantic mapping, as implemented today
| Meaning | Intended color | Class actually in code | Renders as intended? |
|---|---|---|---|
| Status: active | emerald | `text-accent-emerald` | ✅ |
| Status: paused | orange | `text-accent-orange` | ✅ |
| Status: archived | muted white | `text-white/40` | ✅ |
| Priority: high | red / pink | `text-accent-red` | ❌ — not a real token, see §9.1 |
| Priority: normal | cyan | `text-accent-cyan` | ✅ |
| Priority: low | muted white | `text-white/50` | ✅ |
| Stale / needs attention | red / pink | `text-accent-red` | ❌ — not a real token, see §9.1 |
| GitHub push | emerald | `text-accent-emerald` | ✅ |
| GitHub issue | red / pink | `text-accent-red` | ❌ — not a real token, see §9.1 |
| GitHub pull request | purple | `text-accent-purple` | ✅ |
| GitHub create | cyan | `text-accent-cyan` | ✅ |

---

## 3. Typography

Single typeface: **Inter**, loaded via `next/font/google`. No separate display or monospace face is in use yet (`<code>` blocks fall back to the browser default monospace).

| Token | Size / line-height | Where it shows up |
|---|---|---|
| `text-4xl` | 36px / 40px | Large empty-state emoji only |
| `text-3xl` | 30px / 36px | Page-level `<h1>` ("Dashboard", "Projects") |
| `text-2xl` | 24px / 32px | Project detail `<h1>` |
| `text-xl` | 20px / 28px | Stat numbers |
| `text-lg` | 18px / 28px | Section `<h2>` ("Needs attention", "Active projects") |
| `text-base` | 16px / 24px | |
| `text-sm` | 14px / 20px | Body copy, descriptions, button labels |
| `text-xs` | 12px / 16px | Meta text, badges, timestamps |

Weight: `font-bold` for page titles, `font-medium` for card titles and section headers, `font-semibold` for stat values. Nothing lighter than Inter's default body weight is used anywhere.

### Text-color hierarchy
There's no separate gray scale for text — hierarchy is built entirely by stepping down the opacity of white:

`text-white` (headings) → `white/90` → `white/80` → `white/70` (primary body) → `white/60` (secondary body) → `white/50` (meta/labels) → `white/40` (timestamps, disabled) → `white/30` (placeholder text)

---

## 4. Spacing & layout

| Token | Value | Usage |
|---|---|---|
| Page container | `max-w-7xl mx-auto` | 1280px, every top-level page |
| Page padding | `p-6 md:p-8` | 24px mobile → 32px desktop |
| Section rhythm | `space-y-8` | Vertical gap between page sections |
| List rhythm | `space-y-3` | Gap between stacked cards (activity feed, resources, attention list) |
| Card grid gap | `gap-4` | Project card grid, stats strip |
| Card padding | `p-6` default / `p-4` compact | `GlassCard` default vs. list-item usage |

Grids: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for project cards, `grid-cols-2 md:grid-cols-4` for the stats strip.

---

## 5. Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-full` | 9999px | Badges/pills |
| `rounded-xl` | 12px | Inputs, buttons, liquid-glass link chips |
| `rounded-lg` | 8px | Resource link chips |
| `rounded-2xl` | 16px | `GlassCard` base radius |
| `rounded-4xl` | 32px | Defined in config, not yet used |
| `rounded-5xl` | 40px | Defined in config, not yet used |

---

## 6. Elevation

### 6.1 Blur scale
A custom scale that overrides Tailwind's defaults outright (same key names, different values):

| Token | Value | Used by |
|---|---|---|
| `backdrop-blur-xs` | 2px | Defined, not yet used |
| `backdrop-blur-sm` | 4px | Defined, not yet used |
| `backdrop-blur-md` | 8px | `.glow-input` |
| `backdrop-blur-lg` | 12px | Mobile fallback for `.glass-elevated` (≤768px) |
| `backdrop-blur-xl` | 16px | `.glass` — default card surface |
| `backdrop-blur-2xl` | 24px | `.glass-elevated` |
| `backdrop-blur-3xl` | 40px | Defined, not yet used |

### 6.2 Shadow / glow
| Token | Value | Used by |
|---|---|---|
| `shadow-glass` | `0 8px 32px rgba(0,0,0,0.3)` | Defined, not yet used directly |
| `shadow-glass-lg` | `0 12px 48px rgba(0,0,0,0.4)` | `GlassCard` `elevated` variant |
| `shadow-glass-xl` | `0 16px 64px rgba(0,0,0,0.5)` | Defined, not yet used |
| `shadow-glow-blue` | `0 0 20px rgba(0,212,255,0.3)` | Primary buttons, default focus glow |
| `shadow-glow-cyan` | `0 0 20px rgba(6,182,212,0.3)` | `GlowInput glowColor="cyan"` |
| `shadow-glow-purple` | `0 0 20px rgba(139,92,246,0.3)` | `GlowInput glowColor="purple"` |
| `shadow-inner-glow` | `inset 0 0 30px rgba(255,255,255,0.05)` | Defined, not yet used |
| `shadow-glow-red` | — | **Value exists, filed under the wrong theme key** — see §9.2 |
| `shadow-glow-green` | — | **Value exists, filed under the wrong theme key** — see §9.2 |

---

## 7. Motion

| Token | Timing | Status |
|---|---|---|
| `duration-300` | 300ms | The default — `transition-all duration-300` is used almost everywhere |
| easing `smooth` | `cubic-bezier(0.4, 0, 0.2, 1)` | Defined, not yet explicitly applied anywhere |
| easing `bounce-in` | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Defined, not yet used |

Keyframe animations are fully defined in both `tailwind.config.ts` and `globals.css`, but **none are currently applied in any component.** They read as pre-built inventory for the "Phase 5: Polish" milestone in the README roadmap:

| Animation | Duration | Effect |
|---|---|---|
| `animate-float` | 6s infinite | ±10px vertical drift |
| `animate-glow-pulse` | 2s infinite | Breathing shadow, 0.3 → 0.5 alpha |
| `animate-liquid` | 3s (config) / 15s (`.liquid-bg`) | Background-position sweep + subtle scale |
| `animate-shimmer` | 2s linear infinite | Loading-state light sweep |
| `animate-slide-up` / `slide-down` | 0.3s ease-out | 10px translate + fade in |
| `animate-fade-in` | 0.3s ease-out | Opacity 0 → 1 |
| `animate-scale-in` | 0.2s ease-out | Scale 0.95 → 1 + fade in |

The micro-interactions actually shipping today are hand-written utility classes, independent of the animation tokens above: `.micro-bounce` (translateY(-2px) on hover), `.micro-scale` (scale 1.02 hover / 0.98 active), and an inline `hover:scale-105` on project link chips. `prefers-reduced-motion` is not currently handled anywhere in `globals.css`.

---

## 8. Components

### `GlassCard` — `src/components/ui/glass-card.tsx`
| Prop | Options | Default |
|---|---|---|
| `variant` | `default` \| `elevated` \| `bordered` | `default` |
| `glow` | `none` \| `subtle` \| `strong` | `none` |
| `hoverEffect` | boolean | `true` |

`default` = `bg-glass-800/50 backdrop-blur-xl border border-glass`. `elevated` adds `shadow-glass` and darkens to `glass-900/60` with `backdrop-blur-2xl`. `bordered` uses a 2px border at `glass-800/40`. Base radius is `rounded-2xl`, base padding `p-6`.

### `LiquidButton` — `src/components/ui/liquid-button.tsx`
| Prop | Options | Default |
|---|---|---|
| `variant` | `primary` \| `secondary` \| `ghost` \| `outline` | `primary` |
| `size` | `sm` \| `md` \| `lg` | `md` |
| `isLoading` | boolean | `false` |
| `leftIcon` / `rightIcon` | `ReactNode` | — |

`primary` is the only variant wired to the `.liquid-glass` gradient class and `shadow-glow-blue`; the other three are flat glass surfaces at different opacities. Sizes run `h-8`/`h-10`/`h-12`.

### `GlowInput` — `src/components/ui/glow-input.tsx`
| Prop | Options | Default |
|---|---|---|
| `variant` | `default` \| `ghost` \| `bordered` | `default` |
| `glowColor` | `blue` \| `cyan` \| `purple` \| `green` \| `red` | `blue` |

`green` and `red` are the two broken variants — see §9.2.

### Badge / pill pattern — not yet componentized
The same shape is hand-written in at least four places (`project-card.tsx`, `project-header.tsx`, `resource-list.tsx`, `github-activity-feed.tsx`): `text-xs px-2 py-1 rounded-full`, paired with either `bg-white/10 text-white/70` (neutral tag) or `bg-{accent}/20 text-{accent}` (semantic status/priority). It behaves like a component in every way except being one — see the recommendation in §10.

---

## 9. Token audit — known issues

Two real gaps between how components consume tokens and how `tailwind.config.ts` defines them. Both fail silently: nothing throws, nothing warns, the class just doesn't generate any CSS, so the affected UI quietly loses its color instead of erroring. `design-token-proof.html` renders both live.

### 9.1 `accent-red` is used everywhere but was never defined
`text-accent-red` / `bg-accent-red` / `border-accent-red` appear **10 times across 5 files**:
- `src/components/attention-panel.tsx` (3 uses)
- `src/components/project-card.tsx` (2 uses)
- `src/components/project-header.tsx` (2 uses)
- `src/components/github-activity-feed.tsx` (1 use)
- `src/app/projects/[slug]/page.tsx` (2 uses)

`tailwind.config.ts` never declares an `accent.red` key. It does declare `accent.secondary: "#ff2d55"` — a color that fits the intended role exactly but is **never referenced by any component** (zero matches for `accent-secondary` in `src/`).

**Effect:** every "high priority" badge, the stale/"needs attention" flag, and the "issue" activity icon render in whatever color they'd otherwise inherit (plain white) instead of the intended red/pink. The semantic urgency cue is silently missing from the live app.

**Fix:** rename `secondary` → `red` in `tailwind.config.ts` to match how it's actually consumed, or add `red: "#ff2d55"` as an additional key alongside `secondary`.

### 9.2 `glow-red` / `glow-green` shadows are used but filed under the wrong key
This one is subtler than a missing value — the values are already written correctly, just in the wrong part of the config. `tailwind.config.ts` has *two* separate `glow` blocks:

```ts
theme: {
  extend: {
    colors: {
      // ...
      glow: {                                          // ← wrong home
        blue:  "0 0 20px rgba(0, 212, 255, 0.3)",
        cyan:  "0 0 20px rgba(6, 182, 212, 0.3)",
        purple:"0 0 20px rgba(139, 92, 246, 0.3)",
        red:   "0 0 20px rgba(255, 45, 85, 0.3)",       // correct value, wrong key
        green: "0 0 20px rgba(16, 185, 129, 0.3)",      // correct value, wrong key
      },
    },
    boxShadow: {
      // ...
      "glow-blue":   "0 0 20px rgba(0, 212, 255, 0.3)", // ← right home, but only 3 of 5
      "glow-cyan":   "0 0 20px rgba(6, 182, 212, 0.3)",
      "glow-purple": "0 0 20px rgba(139, 92, 246, 0.3)",
    },
  },
},
```

`theme.colors` generates `bg-*` / `text-*` / `border-*` utilities, not `shadow-*` ones — so `colors.glow` was never the right place for a box-shadow value regardless of which color. Nothing in `src/` ever calls `bg-glow-*` or `text-glow-*`, confirmed by search, so the misplaced `blue`/`cyan`/`purple` copies are silently inert rather than actively breaking anything. But `red` and `green` only exist in that unreachable spot — `glow-input.tsx`'s `glowColor="red"` and `glowColor="green"` variants request `focus:shadow-glow-red` / `focus:shadow-glow-green`, which look in `boxShadow`, find nothing, and generate no CSS.

**Effect:** those two focus states still get a border tint (`border-accent-orange/50` and `border-accent-emerald/50` are real, valid color tokens), but lose the glow shadow that `blue`/`cyan`/`purple` get — a visibly weaker, inconsistent focus state for exactly two of the five documented `glowColor` options.

**Fix:** move (not recreate) the two lines — cut `red`/`green` out of `colors.glow` and paste them into `boxShadow`, renamed to match the existing `glow-*` convention there:
```ts
boxShadow: {
  // ...existing glow-blue / glow-cyan / glow-purple...
  "glow-red":   "0 0 20px rgba(255, 45, 85, 0.3)",
  "glow-green": "0 0 20px rgba(16, 185, 129, 0.3)",
},
```
Worth deleting the entire `colors.glow` block at the same time — once `red`/`green` move out, nothing legitimate is left in it.

### 9.3 Minor — icon strategy is split
`lucide-react` is a listed dependency, but no component currently imports from it. Every icon in the app today is either a hand-rolled inline SVG (`PlusIcon`, `SearchIcon`, `SyncIcon`, each redefined per-file) or an emoji used for empty states and stat labels. Not a bug, but worth a deliberate call before more icons get added — either commit to `lucide-react` and delete the duplicated inline SVGs, or drop the dependency.

### 9.4 Minor — `/settings` isn't themed yet
`src/app/settings/page.tsx` is a bare stub (`<main className="p-8">`) with none of the glass/accent system applied. Expected at this stage of the roadmap — noted here so it isn't mistaken for an oversight later.

---

## 10. Usage guidelines

- **Build new semantics from the working palette.** `accent-primary/purple/cyan/emerald/orange` plus the `white/NN` opacity scale cover everything the app currently needs. Don't inline a new hex value in a component — add it to `tailwind.config.ts` first, exactly the step that got skipped in §9.
- **Use `white/NN` for text hierarchy, not Tailwind's default `gray-*` scale.** Mixing the two would break the OLED/glass cohesion — a `gray-400` on true black looks muddy in a way `white/40` doesn't.
- **Never ship a surface without a blur + border pair.** A translucent background alone reads as a flat, slightly-dirty box; the blur is what sells "glass," and the 1px `border-glass` hairline is what keeps a card legible against another card behind it.
- **Extract `<Badge>` before adding a fifth hand-written instance.** The pattern is stable enough (`text-xs px-2 py-1 rounded-full` + neutral/semantic color pair) that duplicating it again is pure debt.
- **Before shipping any new `accent-*` or `glow-*` class name, grep `tailwind.config.ts` for it first.** That one check would have caught both issues in §9.

---

## 11. Reference
- **Live proof:** `design-token-proof.html` — every token in this document, rendered, plus the two `text-accent-red` / `shadow-glow-red` failures shown as they actually appear in the running app.
- **Source of truth:** `tailwind.config.ts`, `src/app/globals.css`, `src/components/ui/glass-card.tsx`, `src/components/ui/liquid-button.tsx`, `src/components/ui/glow-input.tsx`.
