# Design Guidelines: ADAPTY Back Pain Diagnostic Tool

## Design Approach

**Selected Approach**: Reference-Based (Healthcare SaaS)
- **Primary References**: Levels Health (clean scientific credibility) + Linear (minimalist precision) + Whoop (performance-focused)
- **Rationale**: Health-tech targeting high-performing professionals requires clinical trust combined with premium positioning. Avoid wellness clichés; emphasize functional outcomes.

**Core Principle**: "Clinical Precision Meets Professional Performance"
- Not medical/sterile
- Not fluffy wellness
- Scientific credibility + modern simplicity

---

## Typography

**Font System**: (Google Fonts via CDN)
- **Primary**: Inter (headings, UI elements) - clean, professional, technical
- **Secondary**: Inter (body text) - excellent readability for forms/diagnostic content

**Hierarchy**:
- Hero Headlines: text-5xl to text-6xl, font-bold
- Section Headers: text-3xl to text-4xl, font-semibold  
- Subsections: text-xl to text-2xl, font-medium
- Body Text: text-base to text-lg, font-normal
- Form Labels: text-sm, font-medium, uppercase tracking-wide
- Captions/Fine Print: text-sm, font-normal

---

## Layout System

**Spacing Primitives**: Tailwind units of **2, 4, 8, 12, 16**
- Tight spacing: p-2, gap-2 (form elements, compact UI)
- Standard: p-4, p-8 (card padding, section spacing)
- Generous: p-12, p-16, py-20 (section separation)

**Container Strategy**:
- Full-width sections with inner max-w-6xl for content
- Forms/diagnostic tools: max-w-2xl centered
- Multi-column features: max-w-7xl

---

## Component Library

### Navigation
- Sticky header with transparent-to-solid on scroll
- Logo left, CTA button right ("Start Assessment")
- Minimal menu items (3-4 max)
- Mobile: hamburger menu

### Hero Section
**Design**: Split layout (60/40)
- **Left**: Headline + supporting text + primary CTA
  - Headline: "Diagnóstico Científico del Dolor Lumbar en 2 Minutos"
  - Subhead emphasizing professional/evidence-based approach
  - Primary CTA: "Comenzar Evaluación Gratuita"
- **Right**: Hero image showing professional at desk with good posture or abstract geometric representation of spine/back
- Height: min-h-screen on desktop, natural height on mobile

### Diagnostic Form Interface
**Critical Component** - Multi-step form design:
- Progress indicator at top (steps 1-4)
- Large, spacious inputs with clear labels
- Radio buttons and sliders for pain scales
- Visual pain location selector (body diagram)
- One question per screen on mobile, 2-3 grouped logically on desktop
- "Siguiente" / "Anterior" navigation
- Auto-save progress indication

**Form Styling**:
- Input fields: border-2, rounded-lg, p-4
- Focus states: prominent border emphasis
- Error states: clear inline validation
- Helper text: subtle, contextual

### Trust/Credibility Section
- Professional credentials (years of experience, clinical background)
- Evidence-based approach messaging
- Simple statistic cards (no animations)
- 3-column grid on desktop, single column mobile

### Results Preview/CTA Section
- "What You'll Get" breakdown
- Bullet points with icons (Heroicons)
- Strong CTA to start assessment
- Trust badge: "Protocolo Validado Científicamente"

### Footer
- Minimal: Contact info, legal links, professional credentials
- No newsletter signup (focused experience)

---

## Form & Diagnostic UX Specifications

**Pain Assessment Interface**:
- Visual body diagram with clickable zones
- 0-10 pain scale slider with clear number display
- Binary questions as large button toggles (Sí/No)
- Dropdown for occupation type
- Calendar hours worked input (professional context)

**Question Types**:
1. Pain location (interactive diagram)
2. Pain intensity (large slider)
3. Pain triggers (checkboxes with icons)
4. Work context (sitting hours, stress level)
5. Activity level (simple scale)

---

## Images

**Required Images**:
1. **Hero Image** (right side, 40% width): Professional working at ergonomic desk setup or geometric/abstract spine visualization. Clean, modern photography. NOT stock photo of person holding lower back in pain.

2. **Body Diagram**: Simple, clean anatomical diagram of back/spine for pain location selection. Line art style, not photographic.

3. **Optional Credential Photo**: Professional headshot of Victor Gómez if using personal credibility approach

**Placement**: Hero section prominent, diagnostic tool uses diagrams, avoid decorative imagery elsewhere.

---

## Key Differentiators

1. **No Wellness Fluff**: Avoid sunset imagery, meditation poses, generic "balance" visuals
2. **Functional Language**: "Reduce dolor" not "encuentra tu bienestar"
3. **Data-Driven Design**: Show methodology, not promises
4. **Professional Grade**: Target executives, not casual users
5. **Speed of Assessment**: Emphasize "2 minutos" completion time

**Critical Success Factor**: The diagnostic form must feel legitimate, scientific, and quick - like a real clinical assessment, not a BuzzFeed quiz.