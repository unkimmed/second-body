import { BodyPartCode } from '@second-body/shared'

export const VIEW_BOX_W = 120
export const VIEW_BOX_H = 248
export const VIEW_BOX = `0 0 ${VIEW_BOX_W} ${VIEW_BOX_H}`

// SVG display size — maintains exact aspect ratio of viewBox
export const SVG_DISPLAY_W = 180
export const SVG_DISPLAY_H = Math.round((SVG_DISPLAY_W * VIEW_BOX_H) / VIEW_BOX_W) // 372

export type ZoneShape =
  | { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { type: 'rect'; x: number; y: number; width: number; height: number; rx?: number }

export interface BodyZone {
  code: BodyPartCode
  shape: ZoneShape
  /** Which view(s) this zone appears on */
  view: 'front' | 'back' | 'both'
  /** Additional shapes for the same code (e.g. right ear mirroring left) */
  extraShapes?: ZoneShape[]
}

/**
 * All L3 body part zones in SVG viewBox coordinates (0 0 120 248).
 *
 * Render order matters: later zones appear on top and win hit-testing.
 * Face detail zones (eye, nose, mouth, ear) are placed after head so they
 * take priority when zoomed in.
 */
export const BODY_ZONES: BodyZone[] = [
  // ── HEAD SILHOUETTE ──────────────────────────────────────────────
  { code: 'head', view: 'both', shape: { type: 'ellipse', cx: 60, cy: 16, rx: 17, ry: 17 } },

  // ── NECK ─────────────────────────────────────────────────────────
  {
    code: 'neck',
    view: 'both',
    shape: { type: 'rect', x: 54, y: 33, width: 12, height: 12, rx: 3 },
  },

  // ── SHOULDERS ────────────────────────────────────────────────────
  {
    code: 'left_shoulder',
    view: 'both',
    shape: { type: 'ellipse', cx: 38, cy: 52, rx: 14, ry: 10 },
  },
  {
    code: 'right_shoulder',
    view: 'both',
    shape: { type: 'ellipse', cx: 82, cy: 52, rx: 14, ry: 10 },
  },

  // ── TORSO (front view) ────────────────────────────────────────────
  {
    code: 'chest',
    view: 'front',
    shape: { type: 'rect', x: 44, y: 44, width: 32, height: 28, rx: 4 },
  },
  {
    code: 'abdomen',
    view: 'front',
    shape: { type: 'rect', x: 44, y: 72, width: 32, height: 26, rx: 4 },
  },
  {
    code: 'pelvis',
    view: 'front',
    shape: { type: 'rect', x: 46, y: 98, width: 28, height: 18, rx: 4 },
  },
  { code: 'genitalia', view: 'front', shape: { type: 'ellipse', cx: 60, cy: 109, rx: 8, ry: 6 } },

  // ── TORSO (back view) ────────────────────────────────────────────
  {
    code: 'back',
    view: 'back',
    shape: { type: 'rect', x: 44, y: 44, width: 32, height: 28, rx: 4 },
  },
  {
    code: 'lower_back',
    view: 'back',
    shape: { type: 'rect', x: 44, y: 72, width: 32, height: 26, rx: 4 },
  },

  // ── HIP (both views) ─────────────────────────────────────────────
  { code: 'hip', view: 'both', shape: { type: 'ellipse', cx: 60, cy: 120, rx: 26, ry: 10 } },

  // ── LEFT ARM ─────────────────────────────────────────────────────
  {
    code: 'left_upper_arm',
    view: 'both',
    shape: { type: 'rect', x: 24, y: 54, width: 13, height: 30, rx: 4 },
  },
  { code: 'left_elbow', view: 'both', shape: { type: 'ellipse', cx: 30.5, cy: 87, rx: 9, ry: 7 } },
  {
    code: 'left_forearm',
    view: 'both',
    shape: { type: 'rect', x: 24, y: 94, width: 13, height: 26, rx: 4 },
  },
  { code: 'left_wrist', view: 'both', shape: { type: 'ellipse', cx: 30.5, cy: 123, rx: 8, ry: 6 } },
  {
    code: 'left_hand',
    view: 'both',
    shape: { type: 'rect', x: 23, y: 129, width: 15, height: 18, rx: 4 },
  },

  // ── RIGHT ARM ────────────────────────────────────────────────────
  {
    code: 'right_upper_arm',
    view: 'both',
    shape: { type: 'rect', x: 83, y: 54, width: 13, height: 30, rx: 4 },
  },
  { code: 'right_elbow', view: 'both', shape: { type: 'ellipse', cx: 89.5, cy: 87, rx: 9, ry: 7 } },
  {
    code: 'right_forearm',
    view: 'both',
    shape: { type: 'rect', x: 83, y: 94, width: 13, height: 26, rx: 4 },
  },
  {
    code: 'right_wrist',
    view: 'both',
    shape: { type: 'ellipse', cx: 89.5, cy: 123, rx: 8, ry: 6 },
  },
  {
    code: 'right_hand',
    view: 'both',
    shape: { type: 'rect', x: 82, y: 129, width: 15, height: 18, rx: 4 },
  },

  // ── LEFT LEG ─────────────────────────────────────────────────────
  {
    code: 'left_thigh',
    view: 'both',
    shape: { type: 'rect', x: 44, y: 130, width: 15, height: 44, rx: 4 },
  },
  { code: 'left_knee', view: 'both', shape: { type: 'ellipse', cx: 51.5, cy: 176, rx: 9, ry: 8 } },
  {
    code: 'left_calf',
    view: 'both',
    shape: { type: 'rect', x: 44, y: 184, width: 15, height: 36, rx: 4 },
  },
  { code: 'left_ankle', view: 'both', shape: { type: 'ellipse', cx: 51.5, cy: 222, rx: 8, ry: 6 } },
  {
    code: 'left_foot',
    view: 'both',
    shape: { type: 'rect', x: 39, y: 228, width: 18, height: 14, rx: 3 },
  },

  // ── RIGHT LEG ────────────────────────────────────────────────────
  {
    code: 'right_thigh',
    view: 'both',
    shape: { type: 'rect', x: 61, y: 130, width: 15, height: 44, rx: 4 },
  },
  { code: 'right_knee', view: 'both', shape: { type: 'ellipse', cx: 68.5, cy: 176, rx: 9, ry: 8 } },
  {
    code: 'right_calf',
    view: 'both',
    shape: { type: 'rect', x: 61, y: 184, width: 15, height: 36, rx: 4 },
  },
  {
    code: 'right_ankle',
    view: 'both',
    shape: { type: 'ellipse', cx: 68.5, cy: 222, rx: 8, ry: 6 },
  },
  {
    code: 'right_foot',
    view: 'both',
    shape: { type: 'rect', x: 63, y: 228, width: 18, height: 14, rx: 3 },
  },

  // ── FACE DETAILS (front only — require zoom to tap) ──────────────
  // Rendered last so they sit on top of the head zone in hit-testing.
  {
    code: 'ear',
    view: 'front',
    shape: { type: 'ellipse', cx: 43, cy: 16, rx: 3.5, ry: 6 },
    extraShapes: [{ type: 'ellipse', cx: 77, cy: 16, rx: 3.5, ry: 6 }],
  },
  { code: 'skin_face', view: 'front', shape: { type: 'ellipse', cx: 60, cy: 15, rx: 13, ry: 13 } },
  { code: 'eye', view: 'front', shape: { type: 'rect', x: 49, y: 9, width: 22, height: 7, rx: 3 } },
  { code: 'nose', view: 'front', shape: { type: 'ellipse', cx: 60, cy: 20, rx: 4, ry: 5 } },
  {
    code: 'mouth',
    view: 'front',
    shape: { type: 'rect', x: 53, y: 26, width: 14, height: 5, rx: 2 },
  },
]

/** Returns the zones visible for a given view direction */
export function getVisibleZones(view: 'front' | 'back'): BodyZone[] {
  return BODY_ZONES.filter((z) => z.view === 'both' || z.view === view)
}

/** Point-in-shape hit test in SVG viewBox coordinates */
function hitShape(shape: ZoneShape, x: number, y: number): boolean {
  if (shape.type === 'ellipse') {
    const dx = (x - shape.cx) / shape.rx
    const dy = (y - shape.cy) / shape.ry
    return dx * dx + dy * dy <= 1
  }
  return x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height
}

/**
 * Returns the BodyPartCode at SVG viewBox coordinates (svgX, svgY).
 * Zones rendered later (end of array) win — matching the SVG z-order.
 */
export function hitTestZones(
  svgX: number,
  svgY: number,
  view: 'front' | 'back',
): BodyPartCode | null {
  const zones = getVisibleZones(view)
  for (let i = zones.length - 1; i >= 0; i--) {
    const zone = zones[i]
    if (hitShape(zone.shape, svgX, svgY)) return zone.code
    if (zone.extraShapes) {
      for (const extra of zone.extraShapes) {
        if (hitShape(extra, svgX, svgY)) return zone.code
      }
    }
  }
  return null
}
