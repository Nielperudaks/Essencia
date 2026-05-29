# Monochrome GSAP Storefront Makeover Design

Date: 2026-05-29
Scope: Public storefront first

## Goal

Redesign Essencia's customer-facing frontend into a modern minimalist storefront with strong monochrome contrast, editorial spacing, premium product presentation, and GSAP-powered parallax and scroll-triggered animation. The makeover should feel intentionally high-end while preserving the existing ecommerce flows: browse, filter, view product, add to cart, checkout, and track order.

## In Scope

- Home page sections: header, hero, trust/product highlights, featured products, feature/story section, testimonials, newsletter, footer.
- Shop page: collection header, filters, product grid, infinite loading, empty/loading states.
- Product detail page: media, product metadata, quantity controls, add-to-cart and buy-now actions, benefit strip.
- Cart drawer: item list, quantity changes, totals, checkout action.
- Payment and order-status pages: visual alignment with the storefront while preserving form behavior and status behavior.
- Shared visual system: monochrome color tokens, border/shadow language, typography scale, buttons, cards, input states, product tiles.
- Shared animation system: GSAP setup, scroll reveals, parallax media, staggered product reveals, reduced-motion fallback.

## Out of Scope

- Admin screens, admin login, admin order management.
- Backend API changes.
- Product data model changes.
- Replacing checkout/payment business logic.
- Adding new product-management features.

## Visual Direction

The storefront will move away from pastel cosmetic-template styling and toward a high-contrast monochrome editorial system:

- Palette: near-black, white, soft off-white, charcoal, light gray, and strict monochrome overlays.
- Shape language: smaller radii, thin borders, fewer floating rounded cards, flatter surfaces, stronger layout rhythm.
- Typography: large editorial display headings for hero and major sections, tight sans-serif labels for commerce controls, controlled line lengths for readability.
- Imagery: product and beauty imagery becomes the texture and emotional layer; UI decoration stays minimal.
- Layout: generous white space, dense but readable commerce controls, section transitions that feel like a premium catalog.

## Reference Video Interpretation

The attached MP4 is used as an art-direction reference for pacing and mood rather than as a literal asset requirement. Implementation should draw from:

- Cinematic movement: slow depth shifts, subtle scaling, and parallax layers.
- Minimal framing: strong subject focus with restrained supporting UI.
- Scroll rhythm: reveal important copy and product imagery progressively instead of showing every section statically.

If the video can be safely copied into the frontend public assets, it may be used as a local reference/hero media asset. If not, the existing public image and hosted video assets will be restyled to match the same direction.

## Architecture

### Dependencies

Add:

- `gsap`
- `@gsap/react`

These support client-side animation hooks and ScrollTrigger integration in React components.

### Shared Animation Layer

Create a small storefront animation utility or component layer rather than scattering one-off GSAP setup everywhere. It should provide:

- ScrollTrigger registration in client code.
- A reduced-motion check using `prefers-reduced-motion`.
- Reusable reveal patterns for headings, copy, product cards, and media.
- Parallax helpers for hero/media sections.
- Cleanup through `gsap.context()` or `useGSAP()` so route changes do not leave stale triggers.

### Shared Storefront Components

Prefer updating the existing component boundaries instead of replacing the app structure:

- `components/blocks/header.tsx`
- `components/blocks/hero.tsx`
- `components/blocks/product-grid.tsx`
- `components/blocks/feature-section.tsx`
- `components/blocks/testimonials.tsx`
- `components/blocks/newsletter.tsx`
- `components/blocks/footer.tsx`
- `components/blocks/cart-drawer.tsx`
- Public pages under `app/shop`, `app/product/[id]`, `app/payment`, and `app/status`

Where repeated product tile or storefront shell patterns emerge, extract focused helpers only if they reduce duplication without broad refactoring.

## Page Design

### Header

Use a slim fixed header with translucent monochrome styling, thin border, compact nav, and cart/status icon actions. Mobile navigation remains accessible and touch-friendly. Header should stay readable over hero media through contrast-aware background treatment.

### Home

Hero becomes the main brand moment:

- Full-viewport or near-full-viewport editorial layout.
- Large `Essencia`/collection message as first-viewport signal.
- Monochrome overlay on media.
- GSAP entrance reveal for headline, supporting copy, and CTA.
- Subtle parallax between background media and foreground type.

Below the hero:

- Featured products use a stricter product-card system with staggered GSAP scroll reveal.
- Feature/story section uses large media blocks and pinned or parallax motion where it improves flow.
- Testimonials become cleaner monochrome quote columns or marquee-like motion with better brand copy.
- Newsletter/contact area becomes a high-contrast final conversion band.

### Shop

The shop should feel like a premium catalog:

- Editorial collection heading with clear product count.
- Filter controls become segmented monochrome controls with thin borders.
- Product cards use square or portrait media, minimal metadata, clear price, and restrained quick-add affordance.
- Loading, empty, and load-more states match the monochrome system.

### Product Detail

The detail page should focus on the product image and purchase decision:

- Large image panel with scroll/parallax image treatment where appropriate.
- Product information set in a clean editorial column.
- Quantity, add-to-cart, and buy-now controls remain obvious and accessible.
- Benefit icons are simplified into a thin-border row.

### Cart Drawer

The cart drawer should feel like part of the same premium system:

- Monochrome drawer surface.
- Tighter item layout with image thumbnails, quantity stepper, remove icon, and clear totals.
- Checkout CTA remains visually dominant.

### Payment And Status

These pages remain practical, with visual polish:

- Forms use monochrome inputs, thin borders, consistent focus states, and clear error/success messaging.
- Order summary and status progress are aligned with the new card/border language.
- Do not add heavy motion to form workflows beyond subtle reveal; usability wins here.

## Motion Design

Use GSAP for:

- Initial hero reveal.
- ScrollTrigger section reveals.
- Product-card stagger on entering viewport.
- Media parallax inside hero and story sections.
- Optional pinned editorial moment on the homepage if it remains smooth and responsive.

Motion constraints:

- Respect `prefers-reduced-motion`.
- Avoid animating critical form controls in ways that delay interaction.
- Keep durations short and easing premium: smooth, restrained, no bounce-heavy behavior.
- Ensure animation cleanup on unmount.
- Avoid layout shifts by defining stable media/card dimensions.

## Data Flow

Existing data and state flow remain unchanged:

- Product listing and details continue using `api.listProductPage()` and `api.getProduct()`.
- Cart state continues through `CartContext`.
- Payment submission continues using `api.createOrder()`.
- Order tracking continues using public order lookup and WebSocket updates.

The makeover should not change request payloads, test IDs, or API contracts unless a compile error reveals an existing issue that must be fixed.

## Error Handling And Accessibility

- Keep existing empty, loading, error, sold-out, and disabled states.
- Maintain visible focus states for buttons, links, inputs, filters, and drawer controls.
- Preserve semantic headings and labels.
- Keep icon buttons labeled with `aria-label`.
- Ensure contrast passes for text on media overlays.
- Ensure mobile layouts avoid overlapping text, cramped controls, and hidden CTAs.

## Testing And Verification

Run:

- `pnpm lint`
- `pnpm build`

Manual verification:

- Start the frontend dev server.
- Review home, shop, product detail, cart drawer, payment, and status pages on desktop and mobile widths.
- Confirm GSAP animations trigger, clean up, and do not block shopping interactions.
- Confirm reduced-motion fallback disables or simplifies scroll animations.
- Confirm product loading, filters, cart actions, checkout navigation, and order lookup still work as far as local backend availability allows.

## Implementation Notes

- Use `apply_patch` for manual edits.
- Keep admin UI untouched unless shared global CSS affects it; if shared styles do affect admin, keep admin readable.
- Avoid broad rewrites of backend or API code.
- Do not introduce decorative gradients, blobs, or unrelated illustration systems.
- Use existing local and hosted imagery first; add copied reference media only when technically safe and useful.
