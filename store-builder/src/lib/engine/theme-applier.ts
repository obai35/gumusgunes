/**
 * Applies theme configuration to the generated storefront.
 * Replaces CSS variables, color tokens, and font references.
 */

export interface ThemeConfig {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  borderRadius: string
  fontFamily: string
  logoUrl?: string
  faviconUrl?: string
  layoutType?: 'single-page' | 'multi-page'
}

export function applyTheme(content: string, theme: ThemeConfig): string {
  let result = content

  // Replace CSS variable values in globals.css
  result = result.replace(
    /--primary:\s*[^;]+;/g,
    `--primary: ${hexToHsl(theme.primaryColor)};`
  )
  result = result.replace(
    /--secondary:\s*[^;]+;/g,
    `--secondary: ${hexToHsl(theme.secondaryColor)};`
  )
  result = result.replace(
    /--accent:\s*[^;]+;/g,
    `--accent: ${hexToHsl(theme.accentColor)};`
  )
  result = result.replace(
    /--radius:\s*[^;]+;/g,
    `--radius: ${theme.borderRadius};`
  )

  // Replace font family in layout or globals
  result = result.replace(
    /font-family:\s*['"][^'"]+['"]/g,
    `font-family: '${theme.fontFamily}'`
  )

  // Replace Inter font import if applicable
  if (theme.fontFamily !== 'Inter') {
    result = result.replace(
    /@import url\('https:\/\/fonts.googleapis.com\/css2\?family=Inter[^']*'\)/g,
      ''
    )
  }

  return result
}

export function applyThemeToFile(
  filePath: string,
  content: string,
  theme: ThemeConfig
): string {
  // Only modify CSS and TSX/JSX files
  const ext = filePath.split('.').pop()?.toLowerCase()
  if (ext === 'css' || ext === 'tsx' || ext === 'jsx' || ext === 'ts') {
    return applyTheme(content, theme)
  }
  return content
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return null
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null
  return { r, g, b }
}

function hexToHsl(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return '0 0% 0%'
  const { r, g, b } = rgb
  const max = Math.max(r, g, b) / 255
  const min = Math.min(r, g, b) / 255
  const l = (max + min) / 2
  if (max === min) return `0 0% ${Math.round(l * 100)}%`
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r / 255) h = ((g / 255 - b / 255) / d + (g / 255 < b / 255 ? 6 : 0))
  else if (max === g / 255) h = ((b / 255 - r / 255) / d + 2)
  else h = ((r / 255 - g / 255) / d + 4)
  h = Math.round(h * 60)
  return `${h} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}