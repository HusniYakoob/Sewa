---
name: ui-ux-pro-max
description: Pro-level UI/UX standards and process for the Sewa app. Use whenever building, restyling, or reviewing any screen, component, email, or marketing surface — to keep the design clean, consistent, accessible, mobile-first, and free of AI-generated tells. Covers the design-token contract, layout and spacing, Material Symbols icons, motion with framer-motion, dark mode, accessibility, and a pre-ship checklist.
---

# UI/UX Pro Max — Sewa

Build interfaces that look intentional, calm, and trustworthy. Reference feel:
clean fintech (lots of whitespace, soft cards, one accent, strong type). The
brand is black and white for now; colour arrives later from one token.

When designing anything, work in this order: **layout → hierarchy → spacing →
states → motion → accessibility → polish.** Do not skip to polish.

## 1. The token contract (non-negotiable)

- **Never hardcode a colour, radius, or font.** Use the design tokens in
  `src/app/globals.css`. Utilities only: `bg-brand`, `text-foreground`,
  `text-muted-foreground`, `bg-surface`, `bg-surface-muted`, `border-border`,
  `rounded-lg`, `ring-ring`, status `bg-success`/`text-danger`, etc.
- Adding a colour means adding a **token**, not a hex value in a component.
- **Neutrals are the brand** (black/white). **Status colours are functional**
  (success/warning/danger/info) and may stay coloured — but never rely on colour
  alone; pair with an icon or label.
- Every component must look correct in **light and dark**. Because styling comes
  from tokens, this is automatic — so do not add dark-specific hex overrides in
  components. If something breaks in dark, fix the token, not the component.

## 2. Icons and type

- **Icons: Google Material Symbols only**, via `<Icon name="..." />`. No emojis,
  no other icon sets. Names from https://fonts.google.com/icons. Use `filled`
  for selected/active states.
- **Font: Plus Jakarta Sans** (sans, the Google Sans stand-in) and Roboto Mono
  for PINs/codes. Use `tabular-nums` for money and aligned figures.
- Type scale: headings bold and tight (`tracking-tight`); body in
  `text-foreground`; secondary text in `text-muted-foreground`. Keep to a few
  sizes. Avoid more than one display size per screen.

## 3. Layout and spacing

- **Mobile-first.** Design for ~390px width first. Primary actions sit in the
  lower half (thumb zone). Full-width primary buttons on mobile.
- **4px spacing grid.** Use Tailwind's default scale (multiples of 4). Card
  padding 16px (`p-4`), screen gutters 16px (`px-4`), 24px between sections.
- **48px** minimum height for buttons and inputs (thumb-friendly).
- Respect safe areas on native (notch top, home indicator bottom).
- Align everything to a consistent left edge. Avoid centred body text blocks.
  One clear visual hierarchy per screen: one primary action, everything else
  quieter.

## 4. States — design all of them

Every interactive surface needs: **default, hover, focus-visible, active,
disabled, loading, empty, and error.** Specifically:
- Visible `focus-visible` ring (`ring-2 ring-ring`) for keyboard users.
- Empty states: icon + one line of plain copy + a single clear action.
- Loading: skeletons or a spinner; never a dead frozen screen.
- Errors: state what happened and what to do next, in plain language.

## 5. Motion (framer-motion)

Motion is subtle and purposeful, never decorative.
- Durations **150–250ms**; easing `easeOut` for entrances. Respect
  `prefers-reduced-motion`.
- Use for: page/sheet transitions, list item entrances (small stagger),
  press feedback, status changes. Not for: looping, bouncing, attention-grabbing
  animation on idle content.
- Prefer transform/opacity (cheap) over animating layout where possible.
- Keep a shared set of variants so motion feels consistent across screens.

## 6. Accessibility (WCAG 2.1 AA)

- Text contrast **4.5:1** minimum; large text 3:1.
- Touch targets **44x44pt** minimum.
- Status conveyed by **colour + icon/label**, never colour alone.
- Label every icon-only control (`aria-label`).
- Logical heading order; real `<button>`/`<a>`, not clickable divs.
- Test full keyboard navigation and visible focus.

## 7. Content and copy — avoid AI tells

- **No em-dashes or long dashes** in UI copy. Use short sentences or commas.
- **No decorative eyebrow pills** above headings.
- **No gradients** unless explicitly requested.
- Avoid the generic "Empower / Seamless / Unlock / Elevate" marketing voice.
  Write plainly, like a person: say what it is and what to do.
- Sentence case for almost everything. Currency as `LKR 5,000` with
  `tabular-nums`.

## 8. Reuse before building

Check `src/components/ui/` first (Button, Input/Field, Card, Badge, Icon). Extend
or compose existing primitives instead of creating one-off styles. New shared
patterns go into `src/components/ui/` so they are reusable and themeable.

## 9. Pre-ship checklist

Before calling any UI done:
- [ ] Tokens only — no hardcoded hex, radius, or font.
- [ ] Looks right in **light and dark**.
- [ ] Material Symbols only; no emojis. Icon-only controls labelled.
- [ ] Mobile layout works at 390px; primary action reachable by thumb.
- [ ] 4px spacing rhythm; consistent alignment.
- [ ] All states handled (focus, disabled, loading, empty, error).
- [ ] Motion is subtle and respects reduced-motion.
- [ ] Contrast and touch targets meet AA.
- [ ] Copy has no em-dashes, no eyebrow pills, no AI voice.
- [ ] Reused existing components where possible.

When in doubt, remove. Fewer elements, more whitespace, clearer hierarchy.
