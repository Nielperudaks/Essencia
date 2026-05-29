# Monochrome GSAP Storefront Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved monochrome GSAP makeover for Essencia's public storefront while preserving ecommerce behavior.

**Architecture:** Keep the current Next app structure and update the public storefront components in place. Add GSAP through focused client-side helpers, use global monochrome tokens for visual consistency, and keep admin/backend/API flows untouched.

**Tech Stack:** Next 16, React 19, Tailwind CSS v4, Radix/shadcn components, lucide-react, GSAP, @gsap/react, pnpm.

---

## File Structure

- Modify: `frontend/package.json` and `frontend/pnpm-lock.yaml` for GSAP dependencies.
- Modify: `frontend/app/globals.css` for monochrome tokens, reusable storefront utilities, stable dimensions, and reduced-motion safeguards.
- Create: `frontend/hooks/use-storefront-gsap.ts` for shared GSAP registration, reveal, and parallax helpers.
- Modify: `frontend/components/blocks/header.tsx` for the fixed monochrome navigation shell.
- Modify: `frontend/components/blocks/hero.tsx` for hero media, editorial copy, parallax, and initial reveal.
- Modify: `frontend/components/blocks/product-grid.tsx` for homepage product cards and GSAP reveal.
- Modify: `frontend/components/blocks/feature-section.tsx` for editorial story/media sections and GSAP scroll movement.
- Modify: `frontend/components/blocks/testimonials.tsx` for monochrome quote presentation.
- Modify: `frontend/components/blocks/newsletter.tsx` for final high-contrast conversion band.
- Modify: `frontend/components/blocks/footer.tsx` for visual alignment.
- Modify: `frontend/components/blocks/cart-drawer.tsx` for monochrome cart layout.
- Modify: `frontend/app/shop/page.tsx` for catalog styling and product tiles.
- Modify: `frontend/app/product/[id]/page.tsx` for product detail styling and parallax image.
- Modify: `frontend/app/payment/page.tsx` for form/order-summary styling.
- Modify: `frontend/app/status/page.tsx` for order-status styling.

## Task 1: Add GSAP Dependencies And Baseline Verification

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/pnpm-lock.yaml`

- [ ] **Step 1: Verify current frontend install state**

Run: `pnpm install --lockfile-only`

Expected: lockfile resolves without errors.

- [ ] **Step 2: Add GSAP dependencies**

Run: `pnpm add gsap @gsap/react`

Expected: `frontend/package.json` includes `gsap` and `@gsap/react`; lockfile updates.

- [ ] **Step 3: Run lint baseline**

Run: `pnpm lint`

Expected: either pass or reveal pre-existing issues before implementation.

## Task 2: Create Shared GSAP Hook And Monochrome Visual System

**Files:**
- Create: `frontend/hooks/use-storefront-gsap.ts`
- Modify: `frontend/app/globals.css`

- [ ] **Step 1: Add shared GSAP hook**

Create a hook that exports `useStorefrontGsap(scopeRef, setup)` and `prefersReducedMotion()`. It must register `ScrollTrigger`, call setup only when motion is allowed, and use `useGSAP` cleanup behavior.

- [ ] **Step 2: Update global CSS tokens**

Change root colors to monochrome values, reduce the radius scale, add storefront utility classes such as `.storefront-section`, `.storefront-kicker`, `.storefront-display`, `.storefront-card`, `.storefront-button`, `.storefront-button-outline`, `.storefront-input`, and `.storefront-media`.

- [ ] **Step 3: Add reduced-motion safeguards**

Add a `@media (prefers-reduced-motion: reduce)` block that removes smooth scrolling and disables non-essential CSS animations/transitions.

- [ ] **Step 4: Run lint**

Run: `pnpm lint`

Expected: pass or only issues unrelated to these files.

## Task 3: Redesign Homepage Blocks

**Files:**
- Modify: `frontend/components/blocks/header.tsx`
- Modify: `frontend/components/blocks/hero.tsx`
- Modify: `frontend/components/blocks/product-grid.tsx`
- Modify: `frontend/components/blocks/feature-section.tsx`
- Modify: `frontend/components/blocks/testimonials.tsx`
- Modify: `frontend/components/blocks/newsletter.tsx`
- Modify: `frontend/components/blocks/footer.tsx`

- [ ] **Step 1: Redesign header**

Use a compact fixed monochrome nav with thin border, readable overlay background, desktop links, mobile menu, cart count, and status action.

- [ ] **Step 2: Redesign hero**

Use large editorial text, full-screen media, monochrome overlay, CTA, scroll indicator, and GSAP entrance/parallax using the shared hook.

- [ ] **Step 3: Redesign product grid**

Keep existing data fetching and `data-testid` values. Replace current rounded pastel cards with monochrome product cards and GSAP stagger reveal.

- [ ] **Step 4: Redesign story, testimonials, newsletter, and footer**

Keep section responsibilities intact. Use editorial media, quote cards, high-contrast conversion band, and minimal footer layout.

- [ ] **Step 5: Run lint**

Run: `pnpm lint`

Expected: pass or identify issues introduced in homepage files.

## Task 4: Redesign Commerce Pages And Drawer

**Files:**
- Modify: `frontend/app/shop/page.tsx`
- Modify: `frontend/app/product/[id]/page.tsx`
- Modify: `frontend/components/blocks/cart-drawer.tsx`

- [ ] **Step 1: Redesign shop page**

Keep product fetching, filters, load-more behavior, and test IDs. Restyle collection header, filters, loading states, product cards, quick-add buttons, empty state, and load-more UI.

- [ ] **Step 2: Redesign product detail page**

Keep product loading, not-found state, quantity controls, cart actions, and test IDs. Restyle media, content column, CTAs, metadata, and benefit strip; add subtle GSAP reveal/parallax.

- [ ] **Step 3: Redesign cart drawer**

Keep cart state behavior. Restyle drawer, item rows, quantity controls, remove action, totals, checkout CTA, and empty state.

- [ ] **Step 4: Run lint**

Run: `pnpm lint`

Expected: pass or identify issues introduced in commerce files.

## Task 5: Redesign Checkout And Status Pages

**Files:**
- Modify: `frontend/app/payment/page.tsx`
- Modify: `frontend/app/status/page.tsx`

- [ ] **Step 1: Redesign payment page**

Keep form state, validation, bank accordion, upload behavior, order submission, and test IDs. Restyle form cards, inputs, alerts, bank sections, QR panel, and order summary.

- [ ] **Step 2: Redesign status page**

Keep order lookup, WebSocket updates, mark-received behavior, and test IDs. Restyle lookup form, order details, items, progress, and action states.

- [ ] **Step 3: Run lint**

Run: `pnpm lint`

Expected: pass or identify issues introduced in checkout/status files.

## Task 6: Build And Browser Verification

**Files:**
- No planned code edits unless verification reveals defects.

- [ ] **Step 1: Run production build**

Run: `pnpm build`

Expected: build completes successfully.

- [ ] **Step 2: Start dev server**

Run: `pnpm dev`

Expected: local server starts.

- [ ] **Step 3: Verify storefront manually**

Open desktop and mobile widths for `/`, `/shop`, a product page when a product URL is available, `/payment`, and `/status`.

Expected: no overlapping text, animations render, pages remain usable, cart drawer opens, filters respond, and forms remain readable.

- [ ] **Step 4: Final status check**

Run: `git status --short`

Expected: only intended frontend and plan files changed.

## Self-Review

- Spec coverage: The plan covers dependencies, shared animation layer, global visual system, home, shop, product detail, cart drawer, payment, status, accessibility, reduced motion, lint, build, and browser review.
- Placeholder scan: No task uses TBD/TODO/fill-in placeholders.
- Type consistency: The shared hook contract is defined once and reused by client components.
