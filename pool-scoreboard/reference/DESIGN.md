---
name: Monochrome Editorial
colors:
  surface: '#f9f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f9f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f5'
  surface-container: '#eeeef0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e4'
  on-surface: '#1a1c1d'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3132'
  inverse-on-surface: '#f0f0f2'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#5e5e60'
  on-secondary: '#ffffff'
  secondary-container: '#e3e2e4'
  on-secondary-container: '#646466'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1d1b1a'
  on-tertiary-container: '#868381'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#e3e2e4'
  secondary-fixed-dim: '#c7c6c8'
  on-secondary-fixed: '#1b1c1d'
  on-secondary-fixed-variant: '#464748'
  tertiary-fixed: '#e6e1df'
  tertiary-fixed-dim: '#cac6c3'
  on-tertiary-fixed: '#1d1b1a'
  on-tertiary-fixed-variant: '#484645'
  background: '#f9f9fb'
  on-background: '#1a1c1d'
  surface-variant: '#e2e2e4'
typography:
  display:
    fontFamily: Newsreader
    fontSize: 56px
    fontWeight: '400'
    lineHeight: 64px
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Newsreader
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 40px
    fontWeight: '400'
    lineHeight: 48px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Newsreader
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Newsreader
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Newsreader
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 30px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  code-inline:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.06em
spacing:
  gutter: 1.5rem
  margin: 2rem
  gutter-desktop: 2.5rem
  margin-desktop: 4rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 3rem
---

## Brand & Style

This design system expresses the discipline, literary depth, and technical rigor of an accomplished software engineer. It rejects flashy software portfolio tropes—such as neon gradients, floating 3D mockups, and heavy drop shadows—in favor of an archival, high-end editorial aesthetic inspired by print publications, literary journals, and architectural monographs.

The target audience consists of design-conscious engineering leaders, founders, venture partners, and peers who value structural clarity, craft, and precision. The emotional tone is authoritative, cerebral, quiet, and timeless. Every element is deliberate; negative space is treated as an active framing device rather than empty void. Structural lines, precise typographic hierarchy, and tag-driven metadata anchor the interface.

## Colors

The color palette is strictly monochrome and high-contrast, functioning akin to ink on uncoated paper:

- **Canvas & Surfaces:**
  - Base canvas: `#FFFFFF` (pure stark white)
  - Secondary canvas / alternating rows: `#F9F9FB`
  - Subdued containers / code block backgrounds: `#F3F3F5`
- **Text & Foreground:**
  - Primary text / headings: `#111111` (deep rich ink black)
  - Secondary text / dates / metadata: `#666668` (muted neutral slate)
  - Accent / key focus: `#000000` (absolute black)
- **Dividers & Outlines:**
  - Hairline structural borders: `#E5E5E7`
  - High-emphasis accents / active borders: `#111111`

No chromatic accents are permitted. Contrast is generated purely through typographic weight, surface shifts, and razor-thin borders.

## Typography

The typographic hierarchy orchestrates a dialogue between literary editorial craft and computational utility:

- **Headlines (`Newsreader`):** Display and sectional headings rely on Newsreader in Regular and Medium weights. It delivers an intellectual, timeless presence reminiscent of archival journals and book design. Italic cuts may be utilized sparingly for pull quotes, project subtitles, or philosophical commentary.
- **Body Text (`Inter`):** All running prose, project narrative, and long-form case studies are set in Inter. This provides effortless optical legibility, neutral tone, and balanced line rhythm.
- **Metadata, Tags, & Technical Callouts (`JetBrains Mono`):** All technical specifications, repository metrics, date stamps, and categories are set in JetBrains Mono. Set uppercase with slight tracking (`0.04em` to `0.06em`) for categorical labels, and normal casing for code blocks.

## Layout & Spacing

The layout is strictly gridded, drawing inspiration from modernist Swiss editorial layouts. It utilizes an asymmetrical 12-column grid on desktop and a single column on mobile, with a maximum reading container width of 1140px.

- **Desktop (>= 1024px):** 12 columns, 40px gutters (`gutter-desktop`), and 64px outer margins (`margin-desktop`). Typical division pairs an index/metadata column (3-4 columns) with primary content (8-9 columns).
- **Tablet (768px - 1023px):** 6 columns, 24px gutters, and 32px outer margins.
- **Mobile (< 768px):** 1 column fluid grid, 24px outer margins (`margin`).

Rhythm is maintained via consistent section-to-section borders and generous vertical breathing room (`space-xl` and above) between thematic modules. Content blocks align flush with their grid boundaries, connected through shared razor-sharp horizontal and vertical divider rules rather than floating detached cards.

## Elevation & Depth

This system is completely flat. Drop shadows, box shadows, and decorative blur effects are prohibited.

Depth and visual hierarchy are established exclusively via:
1. **Hairline Rules:** 1px solid borders using `#E5E5E7` for structural grids and `#111111` for active or focused states.
2. **Surface Shifts:** Strategic use of `#F9F9FB` for secondary panels or hover rows, and `#F3F3F5` for code blocks and metadata insets.
3. **Contrast Inversion:** High-priority items or selected states invert from white background with dark text to solid `#111111` background with `#FFFFFF` text.

## Shapes

The geometric signature is strictly sharp (`roundedness: 0`). 

All corners on buttons, inputs, tags, dialogs, cards, and technical badges are rendered at `0px` radius. This zero-radius mandate reinforces the architectural, print-like precision of the design system and ensures that adjacent borders align seamlessly along the grid matrix.

## Components

### Buttons
- **Primary:** Solid `#111111` fill, `#FFFFFF` text, `0px` border radius. JetBrains Mono uppercase (`label-md`). Hover state transitions smoothly to `#333333` fill.
- **Secondary / Outline:** Background transparent, 1px solid border `#111111`, `#111111` text. Hover state inverts to `#111111` fill with `#FFFFFF` text.
- **Ghost / Text:** Background transparent, no border, `#111111` text with an underline offset of 4px. Hover state deepens opacity or shows a subtle arrow transition (`->`).

### Chips & Technical Tags
- **Structure:** 1px border `#E5E5E7`, background `#FFFFFF` or `#F9F9FB`, zero radius.
- **Typography:** JetBrains Mono (`label-sm`), uppercase with `0.05em` letter spacing.
- **Active / Selected State:** 1px solid `#111111`, background `#111111`, text `#FFFFFF`.

### Cards & Project Containers
- Zero drop shadows. Enclosed within a 1px solid `#E5E5E7` border.
- Divided into structured internal zones: a metadata bar (date, tech stack tags) separated from the title and narrative description by an internal 1px horizontal rule.
- Interactive cards subtly shift background color from `#FFFFFF` to `#F9F9FB` on hover with a crisp 1px `#111111` outline.

### Lists & Archival Index
- Rendered as tabular rows separated by horizontal 1px hairline dividers (`#E5E5E7`).
- Columns align metadata strictly: Year / Role (JetBrains Mono), Project Title (Newsreader), Technology stack tags, and External Link affordance.
- Row hover triggers a subtle background shift to `#F9F9FB`.

### Checkboxes & Radio Buttons
- Form controls maintain a sharp 0px radius (squares for checkboxes, rotated diamonds or square glyphs for radios).
- Inactive state: 1px border `#666668` on `#FFFFFF` background.
- Checked state: `#111111` fill with an interior white checkmark or inner solid square.

### Input Fields & Textareas
- Crisp 1px border in `#E5E5E7`. Background `#FFFFFF`.
- Typography: Inter for inputs, JetBrains Mono for monospaced code or technical entries.
- Active / Focus: Border changes to 1px `#111111` with no glow or shadow ring.

### Code Blocks & Architecture Snippets
- Inset background in `#F3F3F5` with a 1px `#E5E5E7` border.
- Integrated header row showing file path and language tag in JetBrains Mono (`label-sm`), anchored above the code content with a 1px divider.