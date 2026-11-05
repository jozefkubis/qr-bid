# Feature 01 — QRBid Design System & UI Primitives

**Status:** READY FOR REVIEW — implement only after approval.

## Context

Before writing code, read `AGENTS.md` and all context files it references, especially `context/ui-context.md`, `context/code-standards.md`, and `context/ai-workflow-rules.md`. Follow the Next.js version-specific guidance described in `AGENTS.md`.

This feature establishes the minimal visual foundation for QRBid. It does **not** implement auction screens, authentication, bidding, or database logic.

## Design direction — Terra (approved)

Use the existing Terra visual direction from `context/ui-context.md` and `DESIGN.md` (if present):

- Primary: `#4a7c59` (forest green)
- Page background: `#faf6f0` (warm cream)
- Restrained accent: `#705c30` (warm amber)
- Headings: **Literata**
- Body text and labels: **Nunito Sans**
- Soft shadow: `0 4px 20px rgba(46, 50, 48, 0.06)`
- Soft corners, approximately 12px; generous spacing; warm neutral surfaces
- Mobile-first, with comfortable touch targets (aim for at least 44 × 44 CSS px)

Implement reusable CSS variables in `app/globals.css` (or the existing global stylesheet) and expose them through the project's existing Tailwind setup. Add only the extra neutral, text, border, focus and error tokens actually needed for legibility and accessible states. Do not scatter hardcoded brand colors across components. Check contrast for normal text, button labels, errors and focus indicators; adjust state colors as needed without changing the approved brand palette.

Load the two fonts with `next/font/google` in the existing root layout, respecting the installed Next.js version. Preserve existing app metadata and layout behavior.

## Dependencies

- Use the project's existing **Next.js, React, TypeScript and Tailwind CSS** setup.
- Install **`lucide-react`** for future icons; no need to add decorative icons to every primitive.
- **Do not install `shadcn/ui`**, Radix, a component library, or a CSS-in-JS framework.
- Do not introduce `clsx`, `tailwind-merge`, or a `cn()` helper unless the existing project already uses them or a concrete need arises. Simple class composition is sufficient for these primitives.

## Components

Place small, reusable components in `components/ui/` (or follow an existing consistent project structure). Prefer native HTML elements and typed React props. Use semantic HTML, `forwardRef` only when needed by the installed React version, and allow consumers to pass `className` and relevant native element props.

### 1. Button

- Native `<button>` element; `type="button"` by default to avoid accidental form submissions.
- Variants: `primary` and `secondary`.
- States: normal, hover, visible keyboard focus, disabled, and loading.
- Loading disables repeat clicks and communicates busy state accessibly; use a small indicator if useful.
- Keep labels readable and touch targets comfortably sized.

### 2. Input

- Native `<input>` with a visible label.
- Support `id`, `name`, `type`, `placeholder`, `required`, `disabled`, and other ordinary input props.
- Optional help text and error text; associate them with the input via `aria-describedby`.
- When invalid, expose `aria-invalid` and a clear error message.
- Provide accessible focus and disabled states.

### 3. Textarea

- Native `<textarea>` with a visible label.
- Support `rows`, `name`, `required`, `disabled`, and ordinary textarea props.
- Optional help text and error text, with the same accessible behavior as Input.
- Keep resizing usable unless there is a demonstrated reason to restrict it.

### 4. Card

- Simple styled content container; use a semantic element appropriate to the context (a generic `div` by default is fine).
- Warm light surface, subtle border or shadow, rounded corners, consistent padding.
- Accept `children` and `className`.
- Do not build a large Card subcomponent system at this stage.

## Scope boundaries

**Do not implement now:** Dialog, Tabs, ScrollArea, custom Select, date picker, toast system, navigation, landing page, dashboard, auction forms, QR generation, authentication, Supabase integration, theme switcher, or a full component documentation site.

Use the **light Terra theme only** for this phase. English is the default UI language; components must allow labels to be supplied by consumers so EN/SK translations can be added later. Do not hardcode translated strings inside primitives, apart from essential accessibility text where required.

## Verification / acceptance criteria

1. Project builds and TypeScript checks pass using the scripts already defined in `package.json`.
2. All four components can be imported without errors.
3. Button variants and disabled/loading states behave correctly, including keyboard interaction.
4. Input and Textarea labels, help text, validation errors and focus states work with keyboard and screen readers.
5. Fonts load and Terra tokens apply consistently; no dark theme or default shadcn styling appears.
6. Check at least one narrow mobile viewport and one desktop viewport for overflow, spacing and touch target size.
7. Do not modify unrelated files. If a suitable preview route already exists, use it temporarily for visual checks; otherwise describe how to verify the components without adding a permanent showcase page.
8. Summarize changed files, commands run, results and any unresolved issues. Update `context/progress-tracker.md` **only after implementation and verification**, not while merely planning.

## Delivery approach

Implement in small, reviewable steps: (1) tokens and fonts, (2) Button and Card, (3) Input and Textarea, (4) verification. Stop and report if the repository's current structure or installed versions conflict with this specification. Do not silently add new features.
