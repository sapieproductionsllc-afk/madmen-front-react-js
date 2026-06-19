---
name: Luminous Enterprise
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#38393a'
  surface-container-lowest: '#0d0e0f'
  surface-container-low: '#1a1c1c'
  surface-container: '#1e2020'
  surface-container-high: '#282a2b'
  surface-container-highest: '#333535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#d0c6ab'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#2f3131'
  outline: '#999077'
  outline-variant: '#4d4732'
  surface-tint: '#e9c400'
  primary: '#fff6df'
  on-primary: '#3a3000'
  primary-container: '#ffd700'
  on-primary-container: '#705e00'
  inverse-primary: '#705d00'
  secondary: '#c8c6c5'
  on-secondary: '#303030'
  secondary-container: '#474746'
  on-secondary-container: '#b6b5b4'
  tertiary: '#f9f5f5'
  on-tertiary: '#313030'
  tertiary-container: '#dcd9d9'
  on-tertiary-container: '#605f5e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe16d'
  primary-fixed-dim: '#e9c400'
  on-primary-fixed: '#221b00'
  on-primary-fixed-variant: '#544600'
  secondary-fixed: '#e4e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#121414'
  on-background: '#e2e2e2'
  surface-variant: '#333535'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin: 32px
---

## Brand & Style
This design system is engineered for high-stakes enterprise environments where precision meets prestige. It targets C-suite executives and specialized operators who require a focused, distraction-free interface that feels both powerful and refined.

The aesthetic follows a **Premium Dark Mode** philosophy, blending elements of **Minimalism** with subtle **Glassmorphism**. By utilizing a "Void" background (true black), we eliminate visual noise and allow the high-contrast golden accents to guide the user's intent. The emotional response is one of total control, security, and elite performance.

**Key Principles:**
- **Authority through Contrast:** Deep blacks paired with brilliant gold highlights create a clear hierarchy.
- **Precision Engineering:** Every element is aligned to a strict grid, using thin iconography to maintain a "light" feel despite the dark palette.
- **Subtle Sophistication:** Depth is communicated through tonal layering and micro-interactions rather than heavy shadows or gradients.

## Colors
The palette is rooted in a "Pure Black" foundation to maximize OLED efficiency and visual depth. 

- **Primary (#FFD700):** Reserved for the most critical actions (CTAs), active navigation states, and data highlights. It should be used sparingly to maintain its impact.
- **Surface Tiering:** We use Anthracite (#1A1A1A) for primary containers/cards and Dark Grey (#2A2A2A) for nested elements or hover states.
- **Typography:** Off-white (#E0E0E0) is used for primary body text to reduce eye strain compared to pure white, while mid-greys are used for secondary labels.
- **Semantic Colors:** Status indicators use high-saturation tones that pop against the dark background, ensuring immediate recognition of system health.

## Typography
The system utilizes **Inter** for its exceptional legibility in data-dense interfaces. For technical readouts and labels, we introduce **Geist** to provide a precise, developer-friendly monospaced feel.

**Hierarchy Rules:**
- **Display & Headlines:** Use tight letter spacing and bold weights to command attention.
- **Data Display:** For numerical values in tables, always use the `mono-data` role to ensure tabular alignment.
- **Labels:** Small labels use uppercase with increased letter spacing for a "technical" aesthetic.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. Large desktop views utilize a 12-column grid with a maximum content width of 1440px to ensure readability isn't compromised on ultra-wide monitors.

- **Grid:** 12 columns (Desktop), 8 columns (Tablet), 4 columns (Mobile).
- **Rhythm:** An 8px linear scale drives all padding and margins. 
- **Density:** The system defaults to a "Comfortable" density, but data tables should allow a "Compact" mode where vertical padding is reduced by 50% to maximize information density.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Thin Outlines** rather than traditional shadows.

1.  **Level 0 (Floor):** Pure Black (#000000). Used for the main background.
2.  **Level 1 (Card):** Anthracite (#1A1A1A). Surfaces for primary content.
3.  **Level 2 (Overlay):** Dark Grey (#2A2A2A). For modals, popovers, and tooltips.

**Accents:**
- **Borders:** All surfaces utilize a 1px solid border (#2A2A2A) to define edges against the black background. 
- **Active State:** A subtle Golden Yellow outer glow (4px blur, 10% opacity) may be used for focused inputs or active high-priority cards.

## Shapes
The shape language is professional and balanced. We use a **8px (0.5rem) base radius** for standard components.

- **Standard (8px):** Buttons, Input fields, Chips.
- **Large (16px):** Main content cards, Modals.
- **Full (Pill):** Specialized status badges and biometric scanner frames.

## Components

### Buttons
- **Primary:** Background #FFD700, Text #000000 (Bold). No border.
- **Secondary:** Background #2A2A2A, Text #E0E0E0, 1px Border #333333.
- **Ghost:** No background, Text #FFD700, Border 1px #FFD700 (Low Opacity).

### Data Tables
- Header row uses `label-md` typography with a #1A1A1A background.
- Row hover state: #2A2A2A.
- Badges: Pill-shaped with low-opacity background fills of the status color and 100% opacity text.

### Segmented Progress Bars
- Background: #1A1A1A.
- Active Segment: #FFD700. 
- Use 2px gaps between segments to maintain the "technical" look.

### Biometric UI Elements
- Circular scanning rings using thin (1px) Golden Yellow strokes.
- Use a `backdrop-filter: blur(10px)` on scanner overlays to create a "Glassmorphic" lens effect.

### Input Fields
- Background: #000000. 
- Border: 1px #2A2A2A.
- Focus: 1px #FFD700 with a minimal inner shadow.
- Placeholder Text: #666666.