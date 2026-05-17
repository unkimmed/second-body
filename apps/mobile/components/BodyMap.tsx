import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { BodyPartCode, Severity } from "@second-body/shared";
import { VIEW_BOX } from "../constants/bodyMapLayout";
import {
  BORDER_FADE_RANGE,
  BORDER_OPACITY_MAX,
  L3_TARGET_SCALE,
  L3_VERTICAL_ANCHOR,
  MAX_SCALE,
  MIN_SCALE,
  PAN_DECELERATION,
  PINCH_TO_PAN_COOLDOWN_MS,
  RUBBER_BAND_COEF,
  RUBBER_BAND_SCALE_RANGE,
  SPRING_CONFIG,
  TAP_MAX_DISTANCE_PX,
  TAP_MAX_DURATION_MS,
  TAP_THRESHOLD,
} from "../constants/bodyMapZoomConfig";
import {
  BODY_PART_HITBOXES,
  getBodyPartAtPoint,
} from "../constants/bodyPartHitboxes";
import { BodyMapSVG } from "./BodyMapSVG";

export type BodyMapView = "front" | "back";

type Props = {
  view: BodyMapView;
  severityMap?: Partial<Record<BodyPartCode, Severity>>;
  selected?: BodyPartCode | null;
  /** scale ≥ TAP_THRESHOLD에서 부위 탭 시 호출. */
  onPartTap: (code: BodyPartCode) => void;
  /**
   * L3 진입 부위. null이면 자유 줌, 부위 코드면 해당 부위 중앙으로 줌+잠금.
   * 변화에 따라 자동으로 enter/exit 처리한다.
   */
  l3Active?: BodyPartCode | null;
  /** 확대 상태가 변할 때 호출 (scale > 1 → true). 상단 UI를 숨기는 데 사용. */
  onZoomChange?: (isZoomed: boolean) => void;
};

// SVG 비율 200:500 유지하며 컨테이너의 어느 정도를 차지할지
const SVG_HEIGHT_RATIO = 0.7;
const SVG_WIDTH_RATIO = 0.6;

function triggerHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** iOS UIKit과 동일한 rubber band 공식: 한계 초과 거리를 점진적으로 둔감화. */
function rubberBandClamp(
  value: number,
  min: number,
  max: number,
  range: number,
  c: number
): number {
  "worklet";
  if (value >= min && value <= max) return value;
  if (value > max) {
    const over = value - max;
    return max + (1 - 1 / ((over * c) / range + 1)) * range;
  }
  const under = min - value;
  return min - (1 - 1 / ((under * c) / range + 1)) * range;
}

export function BodyMap({
  view,
  severityMap = {},
  selected = null,
  onPartTap,
  l3Active = null,
  onZoomChange,
}: Props) {
  const [container, setContainer] = useState({ width: 0, height: 0 });
  const ready = container.width > 0 && container.height > 0;

  // SVG 크기 — 비율 유지하며 컨테이너 안에 가운데 배치
  // 세로 우선이지만 너무 좁은 화면에서는 가로 제약도 적용
  const maxByHeight = container.height * SVG_HEIGHT_RATIO;
  const maxByWidth =
    (container.width * SVG_WIDTH_RATIO * VIEW_BOX.height) / VIEW_BOX.width;
  const svgH = ready ? Math.min(maxByHeight, maxByWidth) : 0;
  const svgW = (svgH * VIEW_BOX.width) / VIEW_BOX.height;
  const svgOriginX = (container.width - svgW) / 2;
  const svgOriginY = (container.height - svgH) / 2;
  const viewBoxScale = svgW / VIEW_BOX.width;

  // 핀치/팬/탭 shared values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  /** L3 진입 직전 자유줌 상태 (exit 시 복귀 대상). */
  const prevScale = useSharedValue(1);
  const prevTranslateX = useSharedValue(0);
  const prevTranslateY = useSharedValue(0);

  /** L3 진입 중일 때 true. 탭/팬/핀치 잠금. */
  const isL3Locked = useSharedValue(false);

  /** 부위 경계선 stroke opacity (scale에 따라 보간). */
  const borderOpacity = useSharedValue(0);

  /** SVG geometry / 컨테이너 크기를 worklet에서 읽기 위해 미러. */
  const svgOriginXSV = useSharedValue(0);
  const svgOriginYSV = useSharedValue(0);
  const viewBoxScaleSV = useSharedValue(1);
  const containerWidthSV = useSharedValue(0);
  const containerHeightSV = useSharedValue(0);
  useEffect(() => {
    if (ready) {
      svgOriginXSV.value = svgOriginX;
      svgOriginYSV.value = svgOriginY;
      viewBoxScaleSV.value = viewBoxScale;
      containerWidthSV.value = container.width;
      containerHeightSV.value = container.height;
    }
  }, [
    svgOriginX,
    svgOriginY,
    viewBoxScale,
    ready,
    container.width,
    container.height,
  ]);

  /** Pinch 종료 시각 — pan.onEnd의 노이즈 velocity decay 방지용. */
  const lastPinchEndAt = useSharedValue(0);
  /** Pinch가 현재 진행 중인지. pan→pinch 전환 시 pan.onEnd 노이즈 차단용. */
  const isPinchActive = useSharedValue(false);

  /** pan 중 첫 손가락의 마지막 화면 좌표 — pan→pinch 전환 시 anchor로 사용. */
  const panLastScreenX = useSharedValue(0);
  const panLastScreenY = useSharedValue(0);
  /** pan이 마지막으로 active했던 시각. pinch 시작 시 직전 pan 여부 판단용. */
  const panLastActiveAt = useSharedValue(0);

  /** Pinch 시작 시점의 anchor 화면 좌표 (centroid 또는 첫 손가락 위치). */
  const savedAnchorScreenX = useSharedValue(0);
  const savedAnchorScreenY = useSharedValue(0);
  /** Pinch 시작 시점의 centroid 화면 좌표 — 이후 centroid 이동량 계산용. */
  const savedCentroidScreenX = useSharedValue(0);
  const savedCentroidScreenY = useSharedValue(0);

  // 임계값 도달 순간 햅틱 1회
  useAnimatedReaction(
    () => scale.value >= TAP_THRESHOLD,
    (isActive, wasActive) => {
      if (isActive && !wasActive) {
        runOnJS(triggerHaptic)();
      }
    }
  );

  // scale → borderOpacity 보간
  useAnimatedReaction(
    () => scale.value,
    (s) => {
      borderOpacity.value = interpolate(
        s,
        [BORDER_FADE_RANGE[0], BORDER_FADE_RANGE[1]],
        [0, BORDER_OPACITY_MAX],
        Extrapolation.CLAMP
      );
    }
  );

  const handleTapAtPoint = useCallback(
    (svgX: number, svgY: number) => {
      const code = getBodyPartAtPoint(svgX, svgY, view);
      if (code) onPartTap(code);
    },
    [onPartTap, view]
  );

  // scale > 1.05 → 확대 상태로 간주. 변화 시 부모에 알림 (상단 UI 숨김용)
  const handleZoomChange = useCallback(
    (zoomed: boolean) => {
      onZoomChange?.(zoomed);
    },
    [onZoomChange]
  );
  useAnimatedReaction(
    () => scale.value > 1.05,
    (zoomed, prev) => {
      if (prev !== null && zoomed !== prev) {
        runOnJS(handleZoomChange)(zoomed);
      }
    }
  );

  // L3 진입/복귀
  const prevL3Ref = useRef<BodyPartCode | null>(null);
  useEffect(() => {
    const wasActive = prevL3Ref.current;
    const isActive = l3Active;
    prevL3Ref.current = l3Active;

    if (!ready) return;

    if (!wasActive && isActive) {
      const bbox = BODY_PART_HITBOXES[isActive][view];
      if (!bbox) return;

      prevScale.value = scale.value;
      prevTranslateX.value = translateX.value;
      prevTranslateY.value = translateY.value;

      const targetScale = L3_TARGET_SCALE;
      // SVG 좌표 → 컨테이너 layout 좌표
      const layoutCenterX = svgOriginX + bbox.centerX * viewBoxScale;
      const layoutCenterY = svgOriginY + bbox.centerY * viewBoxScale;
      const targetTX = container.width / 2 - layoutCenterX * targetScale;
      const targetTY =
        container.height * L3_VERTICAL_ANCHOR - layoutCenterY * targetScale;

      scale.value = withSpring(targetScale, SPRING_CONFIG);
      translateX.value = withSpring(targetTX, SPRING_CONFIG);
      translateY.value = withSpring(targetTY, SPRING_CONFIG);
      isL3Locked.value = true;
    } else if (wasActive && !isActive) {
      scale.value = withSpring(prevScale.value, SPRING_CONFIG);
      translateX.value = withSpring(prevTranslateX.value, SPRING_CONFIG);
      translateY.value = withSpring(prevTranslateY.value, SPRING_CONFIG);
      isL3Locked.value = false;
    } else if (wasActive && isActive && wasActive !== isActive) {
      // L3 활성 상태에서 다른 부위로 전환 — 새 부위 중심으로 재줌
      const bbox = BODY_PART_HITBOXES[isActive][view];
      if (!bbox) return;

      const targetScale = L3_TARGET_SCALE;
      const layoutCenterX = svgOriginX + bbox.centerX * viewBoxScale;
      const layoutCenterY = svgOriginY + bbox.centerY * viewBoxScale;
      const targetTX = container.width / 2 - layoutCenterX * targetScale;
      const targetTY =
        container.height * L3_VERTICAL_ANCHOR - layoutCenterY * targetScale;

      scale.value = withSpring(targetScale, SPRING_CONFIG);
      translateX.value = withSpring(targetTX, SPRING_CONFIG);
      translateY.value = withSpring(targetTY, SPRING_CONFIG);
    }
  }, [l3Active, view, ready]);

  // Pinch — 두 손가락 줌. focal point가 손가락 중심을 따라감
  const pinch = Gesture.Pinch()
    .onStart((e) => {
      // 진행 중인 spring/decay를 즉시 중단해 새 제스처와 충돌 방지
      cancelAnimation(scale);
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      isPinchActive.value = true;
      savedScale.value = scale.value;

      // 직전 pan에서 이어진 경우 첫 손가락 위치를 anchor로 사용 (그 지점을 기준으로 줌).
      // 그 외엔 표준 핀치처럼 centroid를 anchor로 사용.
      const fromPan = Date.now() - panLastActiveAt.value < 100;
      const anchorX = fromPan ? panLastScreenX.value : e.focalX;
      const anchorY = fromPan ? panLastScreenY.value : e.focalY;

      savedAnchorScreenX.value = anchorX;
      savedAnchorScreenY.value = anchorY;
      savedCentroidScreenX.value = e.focalX;
      savedCentroidScreenY.value = e.focalY;
      focalX.value = (anchorX - translateX.value) / scale.value;
      focalY.value = (anchorY - translateY.value) / scale.value;
    })
    .onUpdate((e) => {
      if (isL3Locked.value) return;
      // 손가락이 2 → 1로 떨어진 순간 onEnd 직전 마지막 onUpdate가 한 번 더 발사되는데,
      // focal이 두 손가락 중점에서 남은 한 손가락 위치로 점프하면서 화면이 튐. 무시.
      if (e.numberOfPointers < 2) return;
      const rawScale = savedScale.value * e.scale;
      // 한계 초과 시 hard clamp 대신 rubber band 적용 (점진적 둔감화)
      const newScale = rubberBandClamp(
        rawScale,
        MIN_SCALE,
        MAX_SCALE,
        RUBBER_BAND_SCALE_RANGE,
        RUBBER_BAND_COEF
      );
      // anchor 추종: anchor 화면 좌표 = 시작 시점 anchor + (centroid 이동량).
      // 두 손가락이 같이 움직이면 anchor도 따라가고, 한쪽만 벌어지면 anchor가 거의 고정 →
      // 결과적으로 처음 손가락 위치를 기준으로 줌인/줌아웃.
      const effectiveAnchorX =
        savedAnchorScreenX.value + (e.focalX - savedCentroidScreenX.value);
      const effectiveAnchorY =
        savedAnchorScreenY.value + (e.focalY - savedCentroidScreenY.value);
      const rawTX = effectiveAnchorX - focalX.value * newScale;
      const rawTY = effectiveAnchorY - focalY.value * newScale;
      // bounds 초과분에 rubber band 적용 (콘텐츠가 bounds 한참 밖으로 못 흘러가게)
      const minTX = containerWidthSV.value * (1 - newScale);
      const minTY = containerHeightSV.value * (1 - newScale);
      translateX.value = rubberBandClamp(
        rawTX,
        minTX,
        0,
        containerWidthSV.value,
        RUBBER_BAND_COEF
      );
      translateY.value = rubberBandClamp(
        rawTY,
        minTY,
        0,
        containerHeightSV.value,
        RUBBER_BAND_COEF
      );
      scale.value = newScale;
    })
    .onEnd(() => {
      lastPinchEndAt.value = Date.now();
      isPinchActive.value = false;
      if (isL3Locked.value) return;
      const currentScale = scale.value;

      // 1. target scale: 한계 안으로 클램핑
      const targetScale = Math.max(
        MIN_SCALE,
        Math.min(currentScale, MAX_SCALE)
      );

      // 2. target translate 계산: scale 변경 시 focal 유지 보정
      let targetTX = translateX.value;
      let targetTY = translateY.value;
      if (targetScale !== currentScale) {
        const visualFX = translateX.value + focalX.value * currentScale;
        const visualFY = translateY.value + focalY.value * currentScale;
        targetTX = visualFX - focalX.value * targetScale;
        targetTY = visualFY - focalY.value * targetScale;
      }

      // 3. bounds 안으로 clamp (정상 범위에서도 bounds 밖이면 spring back)
      if (targetScale <= MIN_SCALE) {
        targetTX = 0;
        targetTY = 0;
      } else {
        const minTX = containerWidthSV.value * (1 - targetScale);
        const minTY = containerHeightSV.value * (1 - targetScale);
        targetTX = Math.max(minTX, Math.min(targetTX, 0));
        targetTY = Math.max(minTY, Math.min(targetTY, 0));
      }

      // 4. 변경 필요한 것만 spring (불필요한 애니메이션 호출 방지)
      if (targetScale !== scale.value) {
        scale.value = withSpring(targetScale, SPRING_CONFIG);
      }
      if (targetTX !== translateX.value) {
        translateX.value = withSpring(targetTX, SPRING_CONFIG);
      }
      if (targetTY !== translateY.value) {
        translateY.value = withSpring(targetTY, SPRING_CONFIG);
      }
    });

  // Pan — 한 손가락 드래그. iOS와 동일하게 bounds rubber band + 관성 + bounce-back
  const pan = Gesture.Pan()
    .maxPointers(1)
    .onStart((e) => {
      // 핀치의 spring back을 즉시 잡아채 pan으로 자연스럽게 연결 (iOS 동작)
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      panLastScreenX.value = e.x;
      panLastScreenY.value = e.y;
      panLastActiveAt.value = Date.now();
    })
    .onUpdate((e) => {
      if (isL3Locked.value) return;
      if (scale.value <= MIN_SCALE) return;
      panLastScreenX.value = e.x;
      panLastScreenY.value = e.y;
      panLastActiveAt.value = Date.now();
      const rawTX = savedTranslateX.value + e.translationX;
      const rawTY = savedTranslateY.value + e.translationY;
      const minTX = containerWidthSV.value * (1 - scale.value);
      const minTY = containerHeightSV.value * (1 - scale.value);
      // bounds 초과분에 rubber band 적용
      translateX.value = rubberBandClamp(
        rawTX,
        minTX,
        0,
        containerWidthSV.value,
        RUBBER_BAND_COEF
      );
      translateY.value = rubberBandClamp(
        rawTY,
        minTY,
        0,
        containerHeightSV.value,
        RUBBER_BAND_COEF
      );
    })
    .onEnd((e) => {
      if (isL3Locked.value) return;
      if (scale.value <= MIN_SCALE) return;
      // pan→pinch 전환: 두번째 손가락이 닿으면서 pan이 종료되는 케이스. 노이즈 velocity로
      // decay 발사하지 않도록 즉시 return (pinch가 기준점 그대로 이어받음).
      if (isPinchActive.value) return;
      // 핀치 종료 직후 잔여 손가락의 onEnd는 노이즈 velocity로 decay가 튈 수 있음 — 가드
      if (Date.now() - lastPinchEndAt.value < PINCH_TO_PAN_COOLDOWN_MS) {
        // 위치는 그대로 두고 bounds 밖이면 spring back만
        const minTX = containerWidthSV.value * (1 - scale.value);
        const minTY = containerHeightSV.value * (1 - scale.value);
        if (translateX.value < minTX || translateX.value > 0) {
          translateX.value = withSpring(
            Math.max(minTX, Math.min(translateX.value, 0)),
            SPRING_CONFIG
          );
        }
        if (translateY.value < minTY || translateY.value > 0) {
          translateY.value = withSpring(
            Math.max(minTY, Math.min(translateY.value, 0)),
            SPRING_CONFIG
          );
        }
        return;
      }
      const minTX = containerWidthSV.value * (1 - scale.value);
      const minTY = containerHeightSV.value * (1 - scale.value);
      // X축: bounds 안이면 velocity decay, 밖이면 spring back
      if (translateX.value < minTX || translateX.value > 0) {
        translateX.value = withSpring(
          Math.max(minTX, Math.min(translateX.value, 0)),
          SPRING_CONFIG
        );
      } else {
        translateX.value = withDecay({
          velocity: e.velocityX,
          clamp: [minTX, 0],
          deceleration: PAN_DECELERATION,
        });
      }
      // Y축: 동일
      if (translateY.value < minTY || translateY.value > 0) {
        translateY.value = withSpring(
          Math.max(minTY, Math.min(translateY.value, 0)),
          SPRING_CONFIG
        );
      } else {
        translateY.value = withDecay({
          velocity: e.velocityY,
          clamp: [minTY, 0],
          deceleration: PAN_DECELERATION,
        });
      }
    });

  // Tap — 짧고 좁은 입력만, scale ≥ TAP_THRESHOLD에서만
  const tap = Gesture.Tap()
    .maxDuration(TAP_MAX_DURATION_MS)
    .maxDistance(TAP_MAX_DISTANCE_PX)
    .onEnd((e) => {
      if (scale.value < TAP_THRESHOLD) return;

      // visual = layout * scale + translate (transformOrigin '0 0')
      // → layout = (visual - translate) / scale
      // → svg = (layout - svgOrigin) / viewBoxScale
      const layoutX = (e.x - translateX.value) / scale.value;
      const layoutY = (e.y - translateY.value) / scale.value;
      const svgX = (layoutX - svgOriginXSV.value) / viewBoxScaleSV.value;
      const svgY = (layoutY - svgOriginYSV.value) / viewBoxScaleSV.value;
      runOnJS(handleTapAtPoint)(svgX, svgY);
    });

  const composed = Gesture.Simultaneous(pinch, pan, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <View
        style={{ flex: 1, overflow: "hidden" }}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setContainer({ width, height });
        }}
      >
        {ready && (
          <Animated.View
            style={[
              {
                width: container.width,
                height: container.height,
                transformOrigin: "0 0",
              },
              animatedStyle,
            ]}
          >
            <View
              style={{
                position: "absolute",
                left: svgOriginX,
                top: svgOriginY,
                width: svgW,
                height: svgH,
              }}
            >
              <BodyMapSVG
                side={view}
                severityMap={severityMap}
                selected={selected}
                borderOpacity={borderOpacity}
                width={svgW}
                height={svgH}
              />
            </View>
          </Animated.View>
        )}
      </View>
    </GestureDetector>
  );
}
