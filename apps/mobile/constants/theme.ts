/**
 * Design System: Tactical Calm
 * "The Living Sanctuary" — Soft Minimalism
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const Colors = {
  // Surface hierarchy (stacked vellum layers)
  surface: '#fafafa', // Base — the foundation of the sanctuary
  surfaceContainerLow: '#f0f0f0', // Secondary content sections
  surfaceContainerLowest: '#ffffff', // Interactive cards — pops against base
  surfaceContainer: '#f4f4f4', // Mid-level container
  surfaceContainerHigh: '#e8e8e8', // Nested elements (search bars, toggle backgrounds)

  // Primary accent
  primary: '#1a1a1a', // Near-black for focus and action
  primaryDim: '#000000', // Gradient endpoint — deep, slightly darker

  // On-surface (text/icon)
  onSurface: '#1a1a1a', // Default text — never 100% black
  onSurfaceVariant: '#6b6b6b', // Soft secondary text (section headlines)

  // Outline
  outlineVariant: '#c4c4c4', // At 15% opacity for ghost borders only

  // Semantic aliases
  text: {
    primary: '#1a1a1a',
    secondary: '#6b6b6b',
    muted: 'rgba(107, 107, 107, 0.6)',
    inverse: '#fafafa',
    accent: '#1a1a1a',
  },

  // Glass overlay (surface at 80% opacity)
  glass: 'rgba(250, 250, 250, 0.80)',

  // Shadow tone (on-surface @ 6% opacity)
  shadowTone: 'rgba(26, 26, 26, 0.06)',

  // Ghost border (outline-variant @ 15% opacity)
  ghostBorder: 'rgba(196, 196, 196, 0.15)',
} as const

/** Severity 1→5 — muted red, saturation/depth increases (keep in sync with tailwind `severity-*`) */
export const SeverityColor = {
  1: '#ecd3d0',
  2: '#dfaaa5',
  3: '#cf7f78',
  4: '#bb554d',
  5: '#9e3029',
} as const

/** Text color on a filled severity chip — light levels need dark text */
export const SeverityOnColor = {
  1: '#1a1a1a',
  2: '#1a1a1a',
  3: '#fafafa',
  4: '#fafafa',
  5: '#fafafa',
} as const

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

// Pretendard Variable — loaded via CDN in global.css (web only)
export const FontFamily = {
  base: 'Pretendard Variable',
} as const

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
} as const

/** Font size scale (rem → px, base 16px) — Pretendard */
export const FontSize = {
  displayLg: 48, // 3rem
  displayMd: 36, // 2.25rem
  displaySm: 30, // 1.875rem
  headlineLg: 24, // 1.5rem
  headlineMd: 20, // 1.25rem
  titleLg: 18, // 1.125rem
  titleMd: 16, // 1rem
  bodyLg: 16, // 1rem — primary reading size for tracking logs
  bodyMd: 14, // 0.875rem
  bodySm: 12, // 0.75rem
  labelMd: 11, // 0.6875rem — uppercase metadata
  labelSm: 10, // 0.625rem — timestamps
} as const

export const LineHeight = {
  displayLg: 56,
  displayMd: 44,
  displaySm: 38,
  headlineLg: 32,
  headlineMd: 28,
  titleLg: 26,
  titleMd: 24,
  bodyLg: 24,
  bodyMd: 22,
  bodySm: 18,
  labelMd: 16,
  labelSm: 14,
} as const

export const LetterSpacing = {
  display: -0.96, // -0.02em at ~48px — tight, premium feel
  tight: -0.32, // -0.02em at ~16px
  normal: 0,
  wide: 0.5, // For uppercase labels
  wider: 1.0,
} as const

/** Pre-composed text style objects — use these directly on <Text> */
export const TextStyle = {
  displayLg: {
    fontFamily: FontFamily.base,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.displayLg,
    lineHeight: LineHeight.displayLg,
    letterSpacing: LetterSpacing.display,
    color: Colors.onSurface,
  },
  displayMd: {
    fontFamily: FontFamily.base,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.displayMd,
    lineHeight: LineHeight.displayMd,
    letterSpacing: -0.72,
    color: Colors.onSurface,
  },
  displaySm: {
    fontFamily: FontFamily.base,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.displaySm,
    lineHeight: LineHeight.displaySm,
    letterSpacing: -0.6,
    color: Colors.onSurface,
  },
  headlineLg: {
    fontFamily: FontFamily.base,
    fontWeight: FontWeight.semiBold,
    fontSize: FontSize.headlineLg,
    lineHeight: LineHeight.headlineLg,
    letterSpacing: LetterSpacing.normal,
    color: Colors.onSurfaceVariant,
  },
  headlineMd: {
    fontFamily: FontFamily.base,
    fontWeight: FontWeight.semiBold,
    fontSize: FontSize.headlineMd,
    lineHeight: LineHeight.headlineMd,
    letterSpacing: LetterSpacing.normal,
    color: Colors.onSurfaceVariant,
  },
  titleLg: {
    fontFamily: FontFamily.base,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.titleLg,
    lineHeight: LineHeight.titleLg,
    letterSpacing: LetterSpacing.normal,
    color: Colors.onSurface,
  },
  titleMd: {
    fontFamily: FontFamily.base,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.titleMd,
    lineHeight: LineHeight.titleMd,
    letterSpacing: LetterSpacing.normal,
    color: Colors.onSurface,
  },
  bodyLg: {
    fontFamily: FontFamily.base,
    fontWeight: FontWeight.regular,
    fontSize: FontSize.bodyLg,
    lineHeight: LineHeight.bodyLg,
    letterSpacing: LetterSpacing.normal,
    color: Colors.onSurface,
  },
  bodyMd: {
    fontFamily: FontFamily.base,
    fontWeight: FontWeight.regular,
    fontSize: FontSize.bodyMd,
    lineHeight: LineHeight.bodyMd,
    letterSpacing: LetterSpacing.normal,
    color: Colors.onSurface,
  },
  bodySm: {
    fontFamily: FontFamily.base,
    fontWeight: FontWeight.regular,
    fontSize: FontSize.bodySm,
    lineHeight: LineHeight.bodySm,
    letterSpacing: LetterSpacing.normal,
    color: Colors.onSurfaceVariant,
  },
  labelMd: {
    fontFamily: FontFamily.base,
    fontWeight: FontWeight.semiBold,
    fontSize: FontSize.labelMd,
    lineHeight: LineHeight.labelMd,
    letterSpacing: LetterSpacing.wider,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase' as const,
  },
  labelSm: {
    fontFamily: FontFamily.base,
    fontWeight: FontWeight.medium,
    fontSize: FontSize.labelSm,
    lineHeight: LineHeight.labelSm,
    letterSpacing: LetterSpacing.wide,
    color: Colors.onSurfaceVariant,
  },
} as const

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
} as const

// ---------------------------------------------------------------------------
// Border Radius (Roundness Scale)
// ---------------------------------------------------------------------------
// DNA of this system: 0px radius is a violation. Min is 'md'.

export const Radius = {
  // md: 8 — minimum acceptable in edge cases
  md: 8,
  // lg: 2rem (32px) — standard for cards and large containers
  lg: 32,
  // xl: 3rem (48px) — buttons, input fields
  xl: 48,
  // full: pill shape — buttons, chips, checkboxes, radios
  full: 9999,
} as const

// ---------------------------------------------------------------------------
// Elevation / Shadow
// ---------------------------------------------------------------------------
// Depth via tonal layering is preferred. These shadows are for floating elements only.

export const Shadow = {
  // Ambient — for floating characters, toasts, modals
  ambient: {
    shadowColor: Colors.onSurface,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20, // ~40px blur mapped to React Native radius
    elevation: 2, // Android
  },
  // None — explicit "no shadow" reset
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
} as const

// ---------------------------------------------------------------------------
// Gradients
// ---------------------------------------------------------------------------
// Primary CTA gradient: pillowy, not flat.

export const Gradient = {
  primary: {
    colors: [Colors.primary, Colors.primaryDim] as [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  surfaceSubtle: {
    colors: [Colors.surface, Colors.surfaceContainerLow] as [string, string],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
} as const

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

export const Easing = {
  // Mochi-fluid motion — all state changes use this
  standard: [0.4, 0, 0.2, 1] as [number, number, number, number],
  // For React Native Animated, use Easing from 'react-native'
  // Example: Animated.timing(val, { easing: Easing.bezier(...standard) })
  durationFast: 150,
  durationBase: 250,
  durationSlow: 400,
} as const

// ---------------------------------------------------------------------------
// Glass
// ---------------------------------------------------------------------------
// For floating navigation bars and modal overlays.

export const Glass = {
  backgroundColor: Colors.glass,
  // blurAmount: 24 — pass to <BlurView intensity={24} />
  blurAmount: 24,
} as const

// ---------------------------------------------------------------------------
// Composite: Card presets
// ---------------------------------------------------------------------------

export const CardPreset = {
  // Standard interactive card — white pop on cream base
  base: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    ...Shadow.ambient,
  },
  // Nested / inset card — no extra shadow needed (tonal layering)
  inset: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.lg,
  },
  // Emphasis section on a surface background
  emphasis: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radius.lg,
  },
} as const
