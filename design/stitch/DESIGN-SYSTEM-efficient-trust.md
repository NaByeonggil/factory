# Efficient Trust

- Stitch asset: `assets/87a8e84f71724997ae449f0e86788aab`
- assetId: `87a8e84f71724997ae449f0e86788aab`

## Brand & Style

This design system targets professionals in their 30s, balancing the rigor of corporate efficiency with a welcoming, approachable atmosphere. The style is **Modern Corporate**, evolving the density of the reference site into a lighter, "airy" aesthetic.

The personality is "The Reliable Partner"—sophisticated and technologically capable, yet communicative and transparent. Visually, this is achieved through expansive whitespace, high-quality typography, and a deliberate move away from heavy dark backgrounds toward bright, high-contrast surfaces with subtle tonal layering.

## Layout & Spacing

This design system uses a **Fluid Grid with Fixed Max-Width**. The layout relies on an 8px base unit to create a rhythmic, predictable flow.

- **Desktop (1280px+):** 12-column grid, 24px gutters, 80px+ section margins to emphasize "Airy" design.
- **Tablet (768px - 1279px):** 8-column grid, 24px gutters, 40px margins. Content blocks should begin to stack vertically.
- **Mobile (< 768px):** 4-column grid, 16px gutters, 20px margins. 

Prioritize vertical white space between sections (using the `xl` token) to prevent the interface from feeling cluttered, which is essential for the "Sophisticated" aesthetic.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layering** rather than heavy lines.

- **Surface Levels:** The base is white. Secondary containers use `surface-gray`.
- **Shadows:** Use a "Soft Touch" shadow style: `0 4px 20px rgba(15, 23, 42, 0.08)`. This creates a subtle lift that feels modern and lightweight.
- **Interactive States:** On hover, elements should slightly increase their shadow spread and lift (e.g., Y-offset change from 4px to 8px) to provide tactile feedback without looking "squishy."
- **Borders:** Use a 1px border of `border-subtle` only when necessary to define input fields or card boundaries on white backgrounds.

## Components

- **Buttons:** Primary buttons use `primary_color_hex` with white text. Secondary buttons use a `border-subtle` outline with `neutral_color_hex` text. Transitions should be a smooth 200ms ease.
- **Cards:** Cards should have a white background, the "Soft Touch" shadow, and a 16px corner radius. Padding inside cards should be at least `md` (24px).
- **Input Fields:** Use a 1px `border-subtle` and a 8px radius. On focus, the border transitions to `primary_color_hex` with a subtle 2px glow of the same color at 10% opacity.
- **Chips:** Small, metadata-heavy elements should use the `secondary_color_hex` at 10% opacity for the background and 100% opacity for the text.
- **Lists:** Use `surface-gray` for hover states on list items. Maintain generous vertical padding (16px) between list rows to enhance readability.
- **Navigation:** A sticky top navigation with a `backdrop-filter: blur(10px)` and 90% opacity white background ensures the "Airy" feel remains even as the user scrolls.
