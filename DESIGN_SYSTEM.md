# Design System - Trendy AI

## Color Palette

### Primary Colors (Purple/Violet)
- **Primary 500**: `#8b5cf6` - Main brand color
- **Primary 600**: `#7c3aed` - Hover states
- **Primary 700**: `#6d28d9` - Active states
- Used for: Main CTAs, brand elements, primary actions

### Secondary Colors (Cyan/Blue)
- **Secondary 500**: `#06b6d4` - Main secondary color
- **Secondary 600**: `#0891b2` - Hover states
- Used for: Secondary actions, accents, highlights

### Accent Colors (Orange)
- **Accent 500**: `#f97316` - Main accent color
- **Accent 600**: `#ea580c` - Hover states
- Used for: Highlights, warnings, special features

### Neutral Colors (Grays)
- **Neutral 50**: `#fafafa` - Lightest background
- **Neutral 100**: `#f5f5f5` - Light backgrounds
- **Neutral 200**: `#e5e5e5` - Borders, dividers
- **Neutral 300**: `#d4d4d4` - Disabled states
- **Neutral 600**: `#525252` - Secondary text
- **Neutral 700**: `#404040` - Body text
- **Neutral 900**: `#171717` - Headings, dark text

## Gradients

### Primary Gradient
```css
linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)
```
Used for: Hero sections, primary buttons, main CTAs

### Secondary Gradient
```css
linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)
```
Used for: Secondary buttons, accents

### Hero Gradient
```css
linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)
```
Used for: Landing page hero section

## Typography

- **Font Family**: Inter (Google Fonts)
- **Headings**: Bold, gradient text for main headings
- **Body**: Neutral-700 for readability
- **Links**: Primary-600 with hover effects

## Animations

### Fade Animations
- `animate-fade-in`: Simple fade in (0.5s)
- `animate-fade-in-up`: Fade in from bottom (0.5s)
- `animate-fade-in-down`: Fade in from top (0.5s)

### Slide Animations
- `animate-slide-in-right`: Slide in from right (0.3s)
- `animate-slide-in-left`: Slide in from left (0.3s)

### Scale Animations
- `animate-scale-in`: Scale from 0.95 to 1 (0.3s)

### Special Animations
- `animate-bounce-subtle`: Subtle bounce effect (2s infinite)
- `animate-pulse-slow`: Slow pulse (3s infinite)
- `animate-shimmer`: Shimmer loading effect
- `animate-gradient-shift`: Animated gradient background

### Animation Delays
- `animation-delay-200`: 200ms delay
- `animation-delay-400`: 400ms delay
- `animation-delay-600`: 600ms delay
- `animation-delay-800`: 800ms delay

## Component Styles

### Buttons
- **Primary**: Gradient background with shadow, hover scale effect
- **Secondary**: Secondary gradient with shadow
- **Outline**: Border with transparent background, hover fill
- **Ghost**: Text only, hover background

### Cards
- **Default**: White background, shadow, hover lift effect
- **Gradient**: Gradient background for special cards
- Border radius: `rounded-xl` (12px)
- Shadow: `shadow-md` with hover to `shadow-xl`

### Inputs
- Border: 2px solid neutral-300
- Focus: Primary border with ring effect
- Background: White
- Placeholder: Neutral-400

### Badges
- Background: Primary-100
- Text: Primary-700
- Border: Primary-200
- Rounded: Full (`rounded-full`)

## Hover Effects

- **Hover Lift**: `hover-lift` - Subtle translate up on hover
- **Hover Glow**: `hover-glow` - Shadow glow effect
- **Scale**: Buttons scale to 105% on hover, 95% on active

## Usage Examples

### Button
```tsx
<Button variant="primary" size="lg">
  Click Me
</Button>
```

### Card
```tsx
<div className="card-custom p-6 hover-lift">
  Content
</div>
```

### Gradient Text
```tsx
<h1 className="text-gradient-primary">
  Heading
</h1>
```

### Animated Element
```tsx
<div className="animate-fade-in-up animation-delay-200">
  Content
</div>
```

## Best Practices

1. **Consistency**: Always use the defined color palette
2. **Contrast**: Ensure sufficient contrast for accessibility
3. **Animations**: Use sparingly, don't over-animate
4. **Hover States**: Always provide visual feedback
5. **Loading States**: Use primary color for spinners
6. **Shadows**: Use shadow-lg for elevated elements
7. **Borders**: Use neutral-200 for subtle borders

## Dark Mode Support

The design system includes a dark theme (`trendydark`) with:
- Darker backgrounds (neutral-900 base)
- Lighter text colors
- Adjusted gradients for better contrast
- Maintained accessibility standards



