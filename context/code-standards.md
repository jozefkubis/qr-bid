# QRBid – Code Standards

## General

- Write simple, clean, readable code that is easy to understand and maintain.
- Prefer straightforward solutions over clever abstractions or premature optimization.
- Keep files, functions, and components focused on one responsibility.
- Use clear, descriptive English names for variables, functions, and files.
- Avoid duplicated logic when a small reusable helper genuinely improves clarity.
- Fix root causes instead of adding workarounds.
- Add short comments only when they explain *why* something is done or clarify non-obvious logic.
- Follow the approved architecture in `architecture-context.md`.

## TypeScript

- Enable TypeScript strict mode.
- Place local `type` and `interface` declarations near the top of the file, after imports and before functions or components.
- Prefer `type` for component props, unions, and simple data shapes; use `interface` when extension is useful. Be consistent within a file.
- Use explicit types where they improve clarity; allow TypeScript to infer obvious local types.
- Avoid `any`, unnecessary type assertions, and non-null assertions.
- Validate untrusted inputs at server boundaries; TypeScript types alone do not validate runtime data.
- Extract shared types into a separate file only when multiple modules genuinely need them.

## React and Next.js

- Prefer Server Components by default.
- Use `"use client"` only for components requiring client-side interactivity, hooks, or browser APIs.
- Keep components readable: imports, types, component function, simple logic, then JSX.
- Prefer early returns to deeply nested conditions.
- Keep server-side business rules out of client components.
- Use the conventions and documentation of the installed stable Next.js version.

## Server and Data Safety

- Validate inputs and authenticate and authorize sensitive operations on the server.
- Keep route handlers and server actions focused and easy to follow.
- Never trust client-supplied prices, user identities, or auction status.
- Implement bid validation and persistence atomically and safely for concurrent requests, according to `architecture-context.md`.
- Never expose secret keys or sensitive user data to the browser.

## Styling

- Use Tailwind CSS for styling.
- Keep class names organized and avoid unnecessary custom CSS.
- Detailed colors, typography, design tokens, spacing, and component conventions will be defined later in `ui-context.md`.
- Do not invent a design system before it is approved.

## File Organization

- Prefer the simplest structure that fits the current feature.
- Use `app/` for Next.js routes and layouts, `components/` for reusable UI, and `lib/` for shared utilities and server helpers where appropriate.
- Do not create extra layers, folders, or helper files without a clear need.
- Name files by their responsibility.

## Verification

- Make one small, focused change at a time.
- Run relevant type checks, linting, and tests when available.
- Explain what changed, what was verified, and what remains unresolved.
- Follow `ai-workflow-rules.md` for task scope and progress tracking.
