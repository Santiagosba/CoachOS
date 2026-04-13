# CoachOS — UI Design System
#ui #design #glassmorphism

## Design Language
**Glassmorphism / Liquid Glass**
Light, airy glass cards over a gradient background.

## Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#113b7a` | Buttons, active states, accent |
| Text primary | `#10213a` | Headings |
| Text secondary | `#5d6f85` | Subtext, labels |
| Text muted | `#55687e` | Metadata |
| Glass card | `rgba(244,248,255,0.34)` | Card backgrounds |
| Glass input | `rgba(255,255,255,0.42)` | Inputs |
| Glass border | `rgba(255,255,255,0.5)` | Card borders |
| Accent blue | `#dce8ff` | Label badges |
| Tab bar | `rgba(244,248,255,0.72)` | Bottom tabs |

## Typography
- **Eyebrow** (section label): 12px, 700, uppercase, letterSpacing 1.2, `#5d6f85`
- **Heading**: 28–30px, 800, `#10213a`
- **Body**: 15–16px, `#10213a`
- **Secondary**: 13–14px, `#5d6f85`

## Components

### `LiquidGlassBackground`
`src/components/LiquidGlassBackground.tsx`
Provides gradient background + glass utility styles.
```tsx
import LiquidGlassBackground, { glass } from '@/components/LiquidGlassBackground'

<LiquidGlassBackground>
  <View style={[glass.card, styles.myCard]} />
  <View style={[glass.softCard]} />
  <View style={[glass.pill]} />
</LiquidGlassBackground>
```

### glass utilities
- `glass.card` — bordered rounded card with blur
- `glass.softCard` — lighter card variant
- `glass.pill` — small rounded container

### `ExercisePicker`
`src/components/ExercisePicker.tsx`
Modal for searching and creating exercises.
Props: `{ visible, onClose, onSelect(exercise) }`
Features:
- Search bar
- Category filter chips: ALL, MACHINE, BARBELL, DUMBBELL, POWERLIFTING, CALISTHENICS, BODYWEIGHT, CARDIO, MOBILITY, OTHER
- Results colored by muscle group
- Create custom exercise form (name, muscleGroup, category, equipment)

## Tab Bar Style
```tsx
tabBarStyle: {
  position: 'absolute',
  backgroundColor: 'rgba(244,248,255,0.72)',
  borderTopColor: 'rgba(255,255,255,0.35)',
  height: 82,
  paddingTop: 10,
}
tabBarActiveTintColor: '#113b7a'
```

## Related Notes
- [[CoachOS — App Structure]]
