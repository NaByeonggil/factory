# HealthyFarm Bio Trust System

- Stitch asset: `assets/b8c6a9606a7d41ccabb6eed9ee1e6e2f`
- assetId: `b8c6a9606a7d41ccabb6eed9ee1e6e2f`

## Brand & Style
The design system for this project is built on the pillars of **Professionalism, Transparency, and Efficiency**. Targeting 30-something entrepreneurs and corporate procurement managers, the visual language departs from cluttered industrial aesthetics in favor of a **Modern Corporate** style. It balances the sterile precision of pharmaceutical manufacturing with the approachability of health and wellness.

The style emphasizes:
- **Generous Whitespace:** To reduce cognitive load for users navigating complex OEM/ODM service options.
- **Structured Hierarchy:** Clear typographic scaling to ensure information like certifications and production steps are immediately digestible.
- **Subtle Tactility:** Utilizing refined borders and intentional corner radii rather than heavy shadows to convey a sense of modern, clean-room precision.
- **Action-Oriented Layout:** A relentless focus on "Inquiry" conversion, ensuring the primary CTA is always accessible but never intrusive.

## Layout & Spacing
The design system employs a **Fluid-Fixed Hybrid Grid**. Content is constrained to a 1200px max-width on desktop to ensure optimal line lengths, while fluidly adapting to screen widths on mobile.

- **Grid:** A 12-column grid is used for desktop. 
- **Vertical Rhythm:** Large vertical gaps (120px) between sections on desktop create a high-end "Editorial" feel, emphasizing the premium nature of the manufacturing facilities.
- **Mobile Consideration:** Since mobile is the priority, margins are kept tight (20px) to maximize content area, while a dedicated 56px bottom-safe zone is reserved to accommodate the sticky CTA bar.
- **The "Certification" Section:** This is the only section that breaks the standard light background rhythm, using a full-width dark ink background to act as a visual anchor.

## Elevation & Depth
In line with the "Trust" narrative, depth is conveyed through **Flat Tonal Layering** and **Low-Contrast Outlines** rather than dramatic shadows.

- **Borders:** Most cards use a subtle 1px border (`#dcdee1`). This mimics the clean, structured environment of a manufacturing plant.
- **Shadows:** Restricted only to the sticky header (very soft, 4% opacity) and hover states on primary cards.
- **Hero Depth:** The Hero section uses a light green gradient instead of shadows to create a sense of focus and airiness.
- **Sticky Header:** Uses a `backdrop-filter: blur(12px)` with a semi-transparent white background to maintain context while keeping navigation legible.

## Components
- **Buttons:**
  - *Primary:* Solid Deep Green with White text. 8px corner radius.
  - *Secondary:* Ghost style with Deep Green border or Light Green fill.
- **Inquiry Form Elements:**
  - *Chips (Multi-select):* Default has a gray border. Selected state uses a Deep Green border, Light Green (`brand-50`) background, and bold text.
  - *Inputs:* 8px radius. Active state uses a 2px Deep Green stroke.
- **Mobile Bottom Bar:**
  - A 2-column split. Left side (Phone) is white with a border; Right side (Inquiry) is solid Deep Green. This is the most critical conversion element.
- **Ingredient Cards:**
  - 4:3 Aspect ratio for thumbnails. Text area includes a category badge, bold title, and a 3-line truncated summary.
- **Certification Grid:**
  - Monochrome or simple colored icons on a dark background. High contrast is key here to project "Certified Authority."
- **Accordions (FAQ):**
  - Minimalist style with a simple chevron. Background color shifts to `#f7f8f8` when expanded.
