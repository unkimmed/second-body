import { BodyPartCode } from "@second-body/shared";
import { BODY_PART_LAYOUT, ShapeDef } from "./bodyMapLayout";

/**
 * 부위별 히트 테스트용 bounding box.
 * `BODY_PART_LAYOUT`의 도형(circle / rect / ellipse)들에서 자동 계산된다.
 *
 * 실제 인체 일러스트 SVG로 교체할 때는 `bodyMapLayout.ts`만 수정하면
 * 이 파일은 그대로 동작한다 (재계산은 모듈 로드 시 1회).
 */

export type Bbox = {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  /** width × height. 정렬용. */
  area: number;
};

export type BodyMapSide = "front" | "back";

function shapeBbox(shape: ShapeDef): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  switch (shape.type) {
    case "circle":
      return {
        x: shape.cx - shape.r,
        y: shape.cy - shape.r,
        width: shape.r * 2,
        height: shape.r * 2,
      };
    case "rect":
      return {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
      };
    case "ellipse":
      return {
        x: shape.cx - shape.rx,
        y: shape.cy - shape.ry,
        width: shape.rx * 2,
        height: shape.ry * 2,
      };
  }
}

function unionBbox(shapes: ShapeDef[]): Bbox | null {
  if (shapes.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of shapes) {
    const b = shapeBbox(s);
    if (b.x < minX) minX = b.x;
    if (b.y < minY) minY = b.y;
    if (b.x + b.width > maxX) maxX = b.x + b.width;
    if (b.y + b.height > maxY) maxY = b.y + b.height;
  }
  const width = maxX - minX;
  const height = maxY - minY;
  return {
    x: minX,
    y: minY,
    width,
    height,
    centerX: minX + width / 2,
    centerY: minY + height / 2,
    area: width * height,
  };
}

export const BODY_PART_HITBOXES: Record<
  BodyPartCode,
  { front?: Bbox; back?: Bbox }
> = (() => {
  const result = {} as Record<BodyPartCode, { front?: Bbox; back?: Bbox }>;
  for (const code of Object.keys(BODY_PART_LAYOUT) as BodyPartCode[]) {
    const layout = BODY_PART_LAYOUT[code];
    const entry: { front?: Bbox; back?: Bbox } = {};
    if (layout.front) {
      const bbox = unionBbox(layout.front);
      if (bbox) entry.front = bbox;
    }
    if (layout.back) {
      const bbox = unionBbox(layout.back);
      if (bbox) entry.back = bbox;
    }
    result[code] = entry;
  }
  return result;
})();

/**
 * 면적 오름차순으로 사전 정렬된 lookup.
 * 작은 부위(eye, mouth, nose)가 큰 부위(head, skin_face) 안에 겹쳐 있을 때
 * 작은 쪽이 먼저 매치되도록 한다.
 */
const HITBOX_LOOKUP: Record<
  BodyMapSide,
  ReadonlyArray<{ code: BodyPartCode; bbox: Bbox }>
> = (() => {
  const build = (side: BodyMapSide) => {
    const list: { code: BodyPartCode; bbox: Bbox }[] = [];
    for (const code of Object.keys(BODY_PART_HITBOXES) as BodyPartCode[]) {
      const bbox = BODY_PART_HITBOXES[code][side];
      if (bbox) list.push({ code, bbox });
    }
    list.sort((a, b) => a.bbox.area - b.bbox.area);
    return list;
  };
  return { front: build("front"), back: build("back") };
})();

/**
 * SVG 좌표계 기준 (svgX, svgY)에 위치한 부위 코드를 반환한다.
 * 면적 오름차순으로 검사 → 작은 부위 우선 매치.
 */
export function getBodyPartAtPoint(
  svgX: number,
  svgY: number,
  side: BodyMapSide
): BodyPartCode | null {
  for (const { code, bbox } of HITBOX_LOOKUP[side]) {
    if (
      svgX >= bbox.x &&
      svgX <= bbox.x + bbox.width &&
      svgY >= bbox.y &&
      svgY <= bbox.y + bbox.height
    ) {
      return code;
    }
  }
  return null;
}
