---
name: Serene Institutional System
colors:
  surface: '#fbf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae8e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#434750'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#737781'
  outline-variant: '#c3c6d1'
  surface-tint: '#3b5e97'
  primary: '#30548d'
  on-primary: '#ffffff'
  primary-container: '#4a6da7'
  on-primary-container: '#ebefff'
  inverse-primary: '#aac7ff'
  secondary: '#5d5e66'
  on-secondary: '#ffffff'
  secondary-container: '#e3e1ec'
  on-secondary-container: '#63646c'
  tertiary: '#6c5000'
  on-tertiary: '#ffffff'
  tertiary-container: '#89670b'
  on-tertiary-container: '#ffedcf'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#aac7ff'
  on-primary-fixed: '#001b3e'
  on-primary-fixed-variant: '#20467e'
  secondary-fixed: '#e3e1ec'
  secondary-fixed-dim: '#c6c5cf'
  on-secondary-fixed: '#1a1b22'
  on-secondary-fixed-variant: '#46464e'
  tertiary-fixed: '#ffdf9e'
  tertiary-fixed-dim: '#ecc161'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5b4300'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
  surface-subtle: '#F4F4F5'
  surface-base: '#FFFFFF'
  border-quiet: '#EDEDED'
  semantic-success: '#519B6D'
  semantic-warning: '#D99B2D'
  semantic-error: '#C64B4B'
  semantic-info: '#5284B3'
typography:
  display:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  h1:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  card-title:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  small:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  h1-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
---

## Brand & Style

This design system is anchored in the principles of clarity, calmness, and institutional reliability. Drawing inspiration from the quiet efficiency of global information hubs, the aesthetic prioritizes information density without overcrowding. The style is **Modern Corporate Minimalism**, characterized by generous whitespace, a structured hierarchy, and a "content-first" approach that reduces cognitive load for all users.

The target audience requires a tool that feels authoritative yet approachable. By utilizing a restrained color palette and purposeful typography, the interface recedes into the background, allowing the platform's data and tasks to remain the primary focus. The emotional response is one of stability, trust, and ease of use.

## Colors

The color strategy is "Institutional Blue" dominant, using `#4A6DA7` for primary actions and brand identifiers. This is supported by a sophisticated range of neutral grays that define the UI structure without introducing visual noise. 

Semantic colors are intentionally adjusted to low-saturation levels to prevent them from breaking the calm atmosphere of the interface. They should be used sparingly for status indicators and feedback. Backgrounds should primarily utilize `#FFFFFF` for maximum legibility, with `#EDEDED` and `#F4F4F5` used to distinguish different functional zones or nested containers.

## Typography

The system utilizes **Inter** as its sole typeface to ensure a systematic and utilitarian feel across all platforms. The hierarchy is strictly enforced to guide the user's eye through complex data. 

For mobile devices, `display` and `h1` styles should scale down to ensure they do not dominate the viewport, using the `h1-mobile` token as the ceiling for standard screen headlines. Line heights are set generously to enhance readability, particularly for body text. All text should adhere to a minimum contrast ratio of 4.5:1 against its background to meet WCAG 2.2 AA standards.

## Layout & Spacing

This system operates on a rigorous **8px grid**. All margins, paddings, and component heights must be multiples of this base unit. 

The layout follows a **Fluid Grid** approach for internal application views, while landing or informational pages should transition to a **Fixed Grid** (max-width: 1280px) on large displays to maintain line-length readability. 

**Mobile First Strategy:**
- **Mobile (< 600px):** 16px side margins, 4-column layout.
- **Tablet (600px - 1024px):** 24px side margins, 8-column layout.
- **Desktop (> 1024px):** 32px side margins, 12-column layout.

Vertical rhythm is maintained by using `xl` (32px) or `2xl` (48px) spacing between major sections and `md` (16px) spacing between related items within a group.

## Elevation & Depth

The design system avoids heavy shadows, instead using **Tonal Layers** and **Low-Contrast Outlines** to define hierarchy.

1.  **Level 0 (Base):** The primary background color.
2.  **Level 1 (Cards/Surface):** Used for primary content containers. Defined by a 1px border (`#EDEDED`) and a very soft, diffused ambient shadow (0px 2px 4px rgba(0,0,0,0.05)).
3.  **Level 2 (Dropdowns/Popovers):** Higher contrast shadow to indicate interaction (0px 8px 16px rgba(0,0,0,0.08)).
4.  **Level 3 (Dialogs):** The highest elevation, utilizing a semi-transparent backdrop blur (scrim) to focus user attention.

Interactive elements like buttons should appear flat, using color shifts (hover/active) rather than physical elevation changes to indicate state.

## Shapes

The shape language is "Rounded" to soften the professional aesthetic and make the interface feel modern.

- **Buttons & Inputs:** Fixed at 8px (`rounded-md`) to provide a clear, clickable target that fits within the 8px grid.
- **Cards:** 12px (`rounded-lg`) to create a distinct container feel that separates content from the base background.
- **Dialogs & Modals:** 16px (`rounded-xl`) to emphasize their role as temporary, high-level overlays.

Icons must always be **Material Symbols Outline** to maintain the lightweight, airy feel of the typography and spacing.

## Components

### Buttons
- **Primary:** Solid `#4A6DA7` with white text. 8px radius.
- **Secondary:** Transparent background with `#4A6DA7` border and text.
- **Ghost:** No background or border, used for low-priority actions in toolbars.

### Input Fields
- Heights should be standardized to 40px or 48px. 
- Use a 1px border (`#EDEDED`) that darkens to `#4A6DA7` on focus.
- Labels should use the `small` or `label` typography token and always remain visible above the field.

### Cards
- White background, 1px border, 12px radius. 
- Padding should be `lg` (24px) for desktop and `md` (16px) for mobile.

### Chips & Tags
- Used for status or categories. 
- Use low-saturation semantic backgrounds (e.g., semantic-success at 15% opacity) with the full-saturation color for the text. 
- Height should be 24px or 32px with fully rounded (pill) ends.

### Lists
- Use horizontal dividers (`1px #EDEDED`) between items.
- Ensure 12px - 16px of vertical padding for each list item to maintain a comfortable touch target on mobile.

### Dialogs
- Max width on desktop: 560px. 
- On mobile, dialogs should transition to "bottom sheets" for better thumb reachability.