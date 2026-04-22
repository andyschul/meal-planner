# Design Brief

## Foundation

**Purpose**: Meal planner recipe app for shared households — collaborative, functional, no user authentication. Shared data model. iPhone-first responsive with bottom tab bar on mobile, top nav on desktop.

**Tone & Aesthetic**: Bold, modern, clean. Approachable home cooking experience. Professional but warm. Card-layered information design.

**Differentiation**: Emerald green accents (#10b981 / hue 142) on every interactive element — buttons, active tabs, favorite hearts, CTA pills. Dark mode as default with light mode option. Clean typography hierarchy via **Bricolage Grotesque** (display) + **General Sans** (body).

## Palette — OKLCH

| Token               | Light                 | Dark                  | Purpose              |
|---------------------|-----------------------|-----------------------|----------------------|
| **background**      | 0.98 0 0              | 0.145 0 0             | Page/container bg    |
| **foreground**      | 0.12 0 0              | 0.95 0 0              | Primary text         |
| **card**            | 0.96 0 0              | 0.18 0 0              | Card surface         |
| **card-foreground** | 0.15 0 0              | 0.95 0 0              | Text on cards        |
| **muted**           | 0.88 0 0              | 0.22 0 0              | Secondary bg/text    |
| **border**          | 0.9 0 0               | 0.28 0 0              | Borders, dividers    |
| **primary/accent**  | 0.65 0.15 142         | 0.62 0.18 142         | Emerald buttons, CTAs|
| **destructive**     | 0.55 0.22 25          | 0.65 0.19 22          | Delete, error states |

## Typography

| Layer       | Font                  | Size/Weight | Use Case                    |
|-------------|-------------------------|-------------|------------------------------|
| **Display** | Bricolage Grotesque   | 28-32px B7 | Page titles, section headers |
| **Body**    | General Sans          | 16px 400   | Body text, labels            |
| **Small**   | General Sans          | 14px 400   | Secondary text, captions     |
| **Mono**    | JetBrains Mono        | 12px 400   | Code, technical info         |

## Structural Zones

| Zone                        | Styling                                         |
|-----------------------------|--------------------------------------------------|
| **Header/Nav (desktop)**    | `bg-card` + `border-b` subtle, tight spacing    |
| **Tab bar (mobile)**        | `bg-card` sticky bottom, `border-t` subtle      |
| **Content area**            | `bg-background`, comfortable V-padding (20-24px)|
| **Card surfaces**           | `bg-card` + `shadow-md`, 20px padding interior  |
| **Popovers/Modals**         | `bg-card` + `shadow-lg`, centered, fade-in 0.3s|
| **Empty state**             | Centered icon + text, CTA button in primary     |

## Spacing & Rhythm

- **Interior card padding**: 20–24px (generous breathing room)
- **Grid gap**: 16px (card-to-card spacing)
- **Vertical rhythm**: 24px between sections
- **Button group spacing**: 12px between buttons in row
- **Empty states**: 48px top margin, centered, icon 48x48

## Component Patterns

- **Buttons**: Primary (emerald bg + white text), Secondary (outline, emerald text), Tertiary (ghost)
- **Input fields**: Subtle border, 12px padding, focus ring in emerald
- **Cards**: Flex layout, image + text overlay, favorite heart icon top-right (emerald when active)
- **Tabs**: Underline indicator on active (emerald), smooth transition 0.3s
- **Search bar**: Full-width, subtle border, icon left-aligned
- **Modal**: Fade in 0.3s, centered, max 90% viewport width on mobile

## Motion & Transitions

| Interaction          | Easing                            | Duration |
|----------------------|-----------------------------------|----------|
| Tab change           | cubic-bezier(0.4, 0, 0.2, 1)     | 0.3s     |
| Modal open/close     | cubic-bezier(0.4, 0, 0.2, 1)     | 0.3s     |
| Button hover         | cubic-bezier(0.4, 0, 0.2, 1)     | 0.2s     |
| Checkbox check       | cubic-bezier(0.4, 0, 0.2, 1)     | 0.2s     |

## Responsive Design

- **Mobile (< 640px)**: iPhone-first, single-column, bottom tab bar, 16px container padding
- **Tablet (≥ 640px, < 1024px)**: 2-column grids, top nav introduced
- **Desktop (≥ 1024px)**: Top nav, 3-column grids, wider cards, 32px container padding

## Constraints & Anti-Patterns

- ✗ No gradients on backgrounds (use depth layers instead)
- ✗ No heavy shadows (subtle, soft shadows only)
- ✗ No all-caps text except buttons
- ✗ Never mix emerald + other accent colors in the same view
- ✓ Every interactive element uses primary/accent token
- ✓ Text contrast always ≥ AA+ (tested in both light and dark modes)
- ✓ Cards always have a visible border OR slight elevation — never flat

## Signature Detail

Empty states feature centered icon (48x48), friendly copy, and a single prominent CTA button in emerald green. This pattern appears in: Recipes (no recipes yet), Ingredients (library empty), Planner (empty week), Shopping Cart (no items), Templates (none saved). Consistency builds familiarity and reduces cognitive load.
