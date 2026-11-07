# Feature 06 — Create Auction Page (UI Prototype)

**Status:** READY FOR REVIEW — implement only after approval.
**Phase:** Frontend First — UI and local interaction only, no backend.
**Route:** `/auctions/new` (correct spelling: **auctions**, not `austions`).

## 1. Goal and references

Build a polished, responsive **Create Auction** page based on the three supplied screenshots. Use their layout, generous spacing, rounded fields, section dividers and visual hierarchy as references, **not** their product claims, dates, colors or backend behavior. The page is a prototype with English UI copy and clearly local/demo-only behavior.

Before coding, read `AGENTS.md`, `DESIGN.md`, `context/ui-context.md`, `context/code-standards.md`, `context/ai-workflow-rules.md`, `context/progress-tracker.md`, and existing Feature 01–05 specs. Inspect the **actual current repository** first; preserve implemented layout, footer and components. If a feature spec conflicts with approved project context, stop and report it rather than silently changing product rules.

### Technical constraints

- Next.js App Router + React + TypeScript + Tailwind CSS.
- Reuse `components/ui/Button`, `Input`, `Textarea`, `Card` (or their actual existing exports), and `lucide-react` icons.
- **No shadcn/ui**, Radix, additional form library, upload library, backend services or new dependencies unless explicitly approved.
- Use Terra tokens already defined in `app/globals.css`: cream `#FAF6F0`, green `#4A7C59`, warm accent `#705C30`, warm light surfaces; headings Literata, body Nunito Sans. No purple UI, no dark theme.
- English-only for this feature. Do not build a fake language toggle or translation system. Keep visible strings easy to translate later.
- Keep components small and readable; don't refactor unrelated screens.

## 2. Page structure

The route `/auctions/new` must render inside the existing shared site layout. A centered main content column, approximately `max-w-4xl` (adapt to existing site container), with sufficient whitespace on desktop and narrow mobile screens. A simple heading **Create an auction** and short supporting sentence above the form are appropriate. No additional marketing sections.

A **single main light card** contains **four visually separated groups**, using subtle borders/dividers and vertical spacing. Avoid four disconnected heavy panels; the screenshot depicts a cohesive form. The fourth group is the footer action row. Use semantic `<form>` and `<fieldset>`/`<legend>` where appropriate, without enabling real submission.

### Group 1 — Auction details

**Auction Title \***
- Existing `Input` with visible label, placeholder `e.g. Underground parking space #42`.
- Optional muted help text: `Choose a clear, descriptive title.`
- Example title may be prefilled for demo; do not hardcode validation success indicators such as `Valid title` unless validation truly runs.

**Description**
- Existing `Textarea`, about 4–5 visible rows; example content about a parking space is acceptable.
- Muted help text about describing condition, access and important details.
- **Do not claim Markdown support** unless implemented.

**Photos / Images**
- A rounded, dashed-border drop area with upload icon and copy: `Add photos` / `Drag photos here or click to browse`.
- For the UI-only phase, support **local file selection and optional drag-and-drop** using native browser File APIs, if this can be implemented simply and safely. No upload requests and no persistence.
- Accept common image types (`image/jpeg`, `image/png`, `image/webp`) and show a local preview list below the drop area with thumbnail, filename, file size and a Remove control. Use object URLs carefully and revoke them on removal/unmount.
- Alternatively, if implementing local drag/drop would conflict with the approved scope or require a large change, build a clearly labeled **demo-only static list** and report this limitation. Do not mark an image `Uploaded` or pretend it is on the server. Use `Selected locally` or `Demo photo`.
- Provide an accessible native file input and keyboard-accessible browse action; the drop zone must not be the only way to choose a file.
- No Supabase Storage, no remote uploads, no invented size limits or unsupported file-processing promises.

### Group 2 — Pricing & bidding rules

Section heading **Pricing & Bidding Rules**.

Two fields in a two-column grid **on desktop**, stacked **on mobile**:
1. **Starting Price \*** — numeric input, EUR visual prefix or adjacent currency label; example `80`.
2. **Minimum Bid Increment \*** — numeric input, EUR visual prefix or adjacent currency label; example `5`.

Muted help text:
- Starting price: `The first valid bid may equal this amount.`
- Minimum increment: `Later bids must exceed the current highest bid by at least this amount.`

Important: The minimum increment is a **minimum threshold**, not a fixed multiple. Do not implement auction rule validation or submit any values. Display currency consistently, with no assumptions about international currency settings in this phase.

### Group 3 — Duration & End Time

Section heading **Duration & End Time**.

- Three adjacent quick-choice buttons: **+24 hours**, **+3 days**, **+7 days**. Use clear selected state and `aria-pressed` if buttons toggle local selection.
- Under them, two side-by-side native inputs on desktop, stacked on mobile:
  - **End Date** (`type="date"`)
  - **End Time** (`type="time"`)
- Below them, a warm muted **read-only summary panel**, not an editable input. Example: `Ends on [formatted date] at [time] ([time zone])`.
- Buttons may update local component state and corresponding date/time values; manual date/time changes should update the summary. **No server-side deadline logic or business validation.**
- **Do not hardcode `27 Oct 2025`, `CEST`, or a fixed weekday.** For the frontend demo, initialize an end date in the future relative to the user's browser time. If displaying the time zone, derive a readable label from the browser (e.g. `Intl.DateTimeFormat().resolvedOptions().timeZone`) or clearly label it as a preview. Do not assume all users are in Bratislava or that CEST applies year-round.
- Avoid hydration mismatches: initialize client-dependent date/time state after mount or via another safe client-only approach. No ticking countdown required.

**Auction visibility information**
- Under the summary, display a large, gently tinted **informational Card** with a lock icon and heading **Unlisted auction**.
- Copy: `Anyone with the direct link or QR code can view this auction. It won't appear in a public auction directory. Signing in will be required to place a bid.`
- This is **not** an access-controlled private auction: don't say only people physically possessing the QR code can view it. Links can be shared.
- **Do not implement a Public/Private selector**. Public marketplace visibility is an unresolved product decision. No radio buttons, fake toggle or hidden behavior.

### Group 4 — Actions

Separated from the prior group with a thin divider and appropriate padding.

- **Left:** secondary **Save Draft** button, clearly `disabled` with accessible explanatory text (e.g. `Draft saving is not available in this preview`). Draft persistence is not an approved MVP feature.
- **Right:** prominent green primary **Create Auction & Generate QR Code** button, also `disabled` (or visibly `Coming soon`), with a short explanatory message that creation is not yet available. It must **not** submit the form, show fake success, navigate to a nonexistent success page, generate a QR code or store anything.
- On desktop actions are left/right aligned; on mobile they stack or fill available width without overflow. The primary action remains visually prominent even while disabled, but disabled styling must be clear.

## 3. Navigation and header behavior

- All **existing** `Create Auction`/`Create an auction` CTA links in the home hero, final CTA and shared navigation must point to **`/auctions/new`**. Use Next.js `Link`.
- On `/auctions/new`, **hide only the header's Create Auction CTA/navigation item**, to avoid a redundant action. Keep the brand/home link and other already-approved header elements; do not remove the entire header or invent authentication UI.
- If the current header is a client component, `usePathname()` may be used for route-specific visibility. Check both desktop and mobile menus so the item is hidden consistently.
- Preserve the shared footer and existing home-page behavior. No new routes beyond `/auctions/new`.

## 4. Visual and responsive details

- Warm cream page background; white/near-white main card; subtle shadow and border; radius around 12px or consistent with existing UI primitives.
- Form fields: readable labels, rounded inputs, clear focus ring, enough vertical breathing room; don't use serif for body/form controls.
- Desktop (1280–1440px): centered form, title/description/photos full width; pricing two columns; date/time two columns; action buttons at opposite ends.
- Mobile (320–390px): single column, no horizontal scrolling, touch targets at least ~44px, three duration choices wrap gracefully, image filenames truncate safely, action row adapts.
- Do not copy the screenshot's purple accents or overdecorate with gradients, animations, large badges or technical jargon.

## 5. Mock data and interaction policy

- Example auction: `Underground Parking Space #42 – City Tower`, example description, starting price `80`, minimum increment `5`, optional local demo image.
- Demo content must not be represented as saved, published, verified or uploaded.
- Local React state is allowed for input typing, file previews and date selection. **No Clerk, Supabase, APIs, server actions, storage, QR/PDF generation, real bid submission, payment, notifications, or backend writes.**
- Do not add production-grade validation or a form library in this phase; only native input affordances needed for a usable UI prototype.

## 6. Acceptance criteria

- [ ] `/auctions/new` renders a complete form with four clearly separated groups in the specified order.
- [ ] Fields and labels match the approved MVP: title, description, photos, starting price, minimum increment, end date/time.
- [ ] Existing Feature 01 primitives and Terra styling are reused; no shadcn/ui.
- [ ] Desktop has paired pricing fields and paired date/time fields; mobile stacks them without overflow.
- [ ] Quick duration choices visibly select and, if interactive, update the local preview correctly.
- [ ] Summary reflects chosen end date/time; no stale hardcoded 2025 date or fixed CEST.
- [ ] Unlisted-auction information is accurate; no public/private selector or misleading privacy claim.
- [ ] Save Draft and Create Auction actions cannot create or persist anything.
- [ ] Home CTA links navigate to `/auctions/new`; header Create Auction is hidden on this route on desktop **and** mobile.
- [ ] Header and footer remain intact on other routes.
- [ ] Accessible labels, keyboard operation, visible focus, and responsive layout are checked.
- [ ] `npm run lint`, TypeScript check (`npx tsc --noEmit`) and `npm run build` pass, or any environment limitation is reported accurately.
- [ ] No new dependencies or unrelated code changes.
- [ ] After verification, update `context/progress-tracker.md` with **actual** completed work, commands/results and remaining limitations.

## 7. Implementation sequence

1. Inspect the repository and existing UI primitives, route structure and shared header. Report any conflicts.
2. Create the page layout and Groups 1–2; verify visually.
3. Add Group 3 with local date/time preview and the informational unlisted card; verify.
4. Add Group 4, connect existing home CTAs, and hide header CTA on `/auctions/new`; verify desktop/mobile.
5. Run checks and update the progress tracker **only after verification**.

Implement only the approved UI scope. If a conflict or ambiguous behavior requires a product decision, ask before adding functionality.
