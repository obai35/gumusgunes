# POS Premium Visual Redesign

**Goal:** Transform the POS interface from a light cream theme to a luxury dark theme that feels high-end and professional — befitting a jewelry brand.

## Approach

A `.pos-interface` wrapper class overrides CSS theme variables for the POS section only (main site unaffected). All POS components use semantic Tailwind classes (`bg-card`, `text-foreground`, etc.) which automatically adopt the dark values.

## Theme Changes (`.pos-interface`)

| Token | Current | New Dark POS |
|-------|---------|--------------|
| `--background` | cream | deep navy (oklch 0.13) |
| `--foreground` | dark navy | silver |
| `--card` | white | dark semi-transparent (oklch 0.18/0.6) |
| `--card-foreground` | dark navy | silver |
| `--border` | light gray | white @ 12% |
| `--muted-foreground` | medium gray | silver @ 70% |
| `--primary` | navy | gold |
| `--input` | light gray | white @ 12% |

## Visual Enhancements

- **Background:** Navy radial gradient (existing `navy-radial` class)
- **Cards:** Glass effect with subtle gold border, backdrop blur
- **Product cards:** Larger images, hover zoom, gold border on hover, premium shadow
- **Buttons:** Gold gradient primary, refined secondary
- **Payment pills:** Larger, gradient selected state
- **Tabs:** Gold active indicator on glass background
- **Typography:** Better hierarchy with letter-spacing
- **Scrollbar:** Gold-thumb custom scrollbar (existing `scroll-luxury`)

## Files to Modify

- `globals.css` — Add `.pos-interface` class with overrides
- All POS components — Update hardcoded `bg-white`/`text-navy` to semantic tokens
