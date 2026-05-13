/**
 * Body Map 핀치줌 인터랙션 상수.
 * 튜닝은 이 파일만 만지면 된다.
 */

export const MIN_SCALE = 1;
export const MAX_SCALE = 6;

/** scale이 이 값 이상일 때만 부위 탭이 활성화된다. (탭 활성 임계값) */
export const TAP_THRESHOLD = 1.8;

/** L3 진입 시 스프링으로 스냅할 줌 배율. */
export const L3_TARGET_SCALE = 4;

/**
 * L3 진입 시 부위 중앙을 컨테이너 높이의 이 비율 지점으로 이동.
 * 시트가 화면 하단 70%를 가리므로, 부위는 위쪽 30% 영역의 중앙 부근에 위치.
 */
export const L3_VERTICAL_ANCHOR = 0.18;

/** 부위 경계선 stroke opacity 페이드 보간 구간. */
export const BORDER_FADE_RANGE: readonly [number, number] = [
  TAP_THRESHOLD - 0.3,
  TAP_THRESHOLD,
];
export const BORDER_OPACITY_MAX = 0.15;

/** L3 진입/복귀, scale<1 복귀 등 모든 스프링 애니메이션 공통 설정. */
export const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.8,
};

/** iOS UIKit과 동일한 rubber band 계수 (한계 초과분 둔감화 정도). */
export const RUBBER_BAND_COEF = 0.55;
/** Scale에 적용할 rubber band의 "기준 범위" — scale 단위이므로 1.0 정도. */
export const RUBBER_BAND_SCALE_RANGE = 1;

/** Pan 관성 deceleration (iOS UIScrollView 표준). */
export const PAN_DECELERATION = 0.997;

/** Pinch 종료 후 이 시간 동안 잔여 손가락 pan을 무시 (전환 점프 방지). */
export const PINCH_TO_PAN_COOLDOWN_MS = 120;

/** 탭 제스처 — 짧고 좁은 입력만 인식 (팬과 충돌 방지). */
export const TAP_MAX_DURATION_MS = 200;
export const TAP_MAX_DISTANCE_PX = 8;
