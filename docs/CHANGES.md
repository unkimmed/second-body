# Changes

## 2026-05-08 — Body Map 핀치줌 UX 전면 재구현

### 배경
2단계 SVG 줌 (L1 그룹 히트맵 → L2 그룹 확대) + 부위 카드의 한계: 그룹 단위에서 부위 단위로 진입할 때 사용자 의도가 끊기고, 부위 상세는 작은 카드라 trend/history를 보여줄 자리가 없음. `bodymap_ux_prompt.md` 기획에 따라 핀치 기반 연속 줌 + L3 풀 패널(그래프 + 기록 리스트 + 인라인 추가)로 전환. 작업 기획안: `docs/bodymap_pinch_zoom_plan.md`

### 변경 사항
**추가**:
- `apps/mobile/constants/bodyMapZoomConfig.ts` — `TAP_THRESHOLD`(1.8), `MAX_SCALE`(6), `SPRING_CONFIG`, `BORDER_FADE_RANGE` 등 줌 상수
- `apps/mobile/constants/bodyPartHitboxes.ts` — `BODY_PART_LAYOUT`에서 자동 계산한 bbox + 면적 오름차순 정렬된 hit-test (`getBodyPartAtPoint`)
- `apps/mobile/components/BodyMapSVG.tsx` — Pure SVG 렌더러. 모든 부위 stroke를 `<AnimatedG>` 한 번으로 묶어 단일 shared value (`borderOpacity`)로 동기 페이드
- `apps/mobile/components/L3Panel.tsx` — `@gorhom/bottom-sheet` L3 패널 (헤더 + `BottomSheetScrollView` + 고정 `+` 버튼)
- `apps/mobile/components/InlineRecordSheet.tsx` — L3 위에 띄우는 인라인 추가 `BottomSheetModal` (부위 pre-fill + 심각도 1-5 + 메모 + 직접 POST)
- `apps/mobile/components/bodymap/SeverityChart.tsx` — `react-native-svg`로 직접 그린 6개월 추이 그래프 (라인 + 도트, 빈 상태 = 축만)
- `apps/mobile/components/bodymap/PartRecordList.tsx` — 부위별 기록 리스트 (날짜 내림차순)
- `docs/bodymap_pinch_zoom_plan.md` — 본 작업 기획안 (확정 결정사항 포함)

**수정**:
- `apps/mobile/components/BodyMap.tsx` — 재작성. 핀치(focal-point 줌) + 한손 팬(scale > 1만, L3 잠금 시 무시) + 탭(threshold 이상만). `useAnimatedReaction`으로 임계값 햅틱 + 경계선 페이드. `l3Active` prop 변화에 따라 부위 중앙으로 스프링 진입 / 진입 직전 자유줌 상태로 스프링 복귀
- `apps/mobile/app/_layout.tsx` — `GestureHandlerRootView` + `BottomSheetModalProvider` 루트 래핑
- `apps/mobile/app/(tabs)/index.tsx` — 핀치줌 통합. records 원본 보유 + 파생 severityMap (`useMemo`). 앞/뒷면 토글 시 L3 자동 종료. 인라인 시트 저장 → `fetchAllRecords` 재호출로 즉시 갱신
- `apps/mobile/package.json` — `expo-haptics`, `@gorhom/bottom-sheet` 추가

**삭제**:
- `apps/mobile/components/bodymap/BodyMapL1.tsx` (그룹 히트맵 — 핀치줌으로 대체)
- `apps/mobile/components/bodymap/BodyMapL2.tsx` (그룹 확대 뷰 — 동일)
- `apps/mobile/constants/bodyMapZoom.ts` (`LEVEL2_GROUPS`, `ZoomState` 등 — 사용처 전부 사라짐)

### 디자인 결정
- **연속 핀치 줌 + 임계값 기반 탭 활성화**: `scale ≥ 1.8` 도달 순간 햅틱 1회 + 부위 경계선 stroke opacity 0 → 0.15 페이드. 임계값 미만에선 탭 무시.
- **L1에서 부위 단위 색칠만** (그룹 색상 레이어 제거): 단일 SVG에서 37개 부위가 직접 색칠됨. 줌인 시 부드럽게 작은 부위까지 보임.
- **focal-point 핀치 줌**: 손가락 중심이 시각적으로 고정되도록 translate 동시 조정. `transformOrigin: '0 0'` + `visual = layout * scale + translate` 변환식.
- **hit-test는 면적 오름차순**: `skin_face`가 `head` 안에 있을 때 작은 부위(눈/코/입)가 우선 매치되도록 `BODY_PART_HITBOXES`를 area로 사전 정렬.
- **L3 진입 시 4배 줌 + 잠금** (`isL3Locked.value`): 부위 중앙이 화면 중앙에 오도록 translate 계산. 핀치/팬/탭 모두 잠금. 종료는 시트 닫기/스와이프 다운만.
- **L3 → 직전 자유줌 상태로 복귀**: `prevScale/prevTranslate*`에 진입 직전 값 저장 → exit 시 spring으로 복귀. (사용자가 L1 직행이 아닌 L2 자유 핀치줌으로 복귀 요청)
- **인라인 추가는 `BottomSheetModal`**: L3Panel(`BottomSheet`)와 다른 레이어로 스택 가능. 저장 성공 시 자동 dismiss + 부모가 records 재조회.
- **그래프는 `react-native-svg` 직접 그리기**: 6개월 × 최대 1포인트/일 ≈ 180개로 차트 라이브러리 도입 비용 < 직접 구현 비용. 도트 색은 `SEVERITY_FILL`로 심각도 시각화.
- **트래킹 데이터는 클라이언트 가공**: 기존 `GET /api/records`를 그대로 쓰고, `useMemo`로 부위 + 6개월 필터. API 신규 엔드포인트 추가 X.
- **앞/뒷면 토글 시 L3 자동 종료**: 활성 부위가 다른 면에 없을 수 있어 강제 dismiss.

### 영향 범위
- DB / API 스키마 변경 없음
- 기존 기록 작성 화면 (`/records/new`)은 그대로 유지 — 인라인 시트는 직접 POST (별도 라우트/파라미터 사용 X)
- 앞/뒷면 토글, 기록 리스트 탭 등 다른 동선 변경 없음
- 패키지 추가: `expo-haptics ^55.0.14`, `@gorhom/bottom-sheet ^5.2.13` (의존성은 이미 설치된 `reanimated 4.1` + `gesture-handler 2.28`만 사용)

### 미구현 (Phase 6 polish 후보)
- 핀치-아웃으로 L3 종료 (현재는 시트 닫기/스와이프 다운만 — spring 충돌 처리 복잡도 때문에 MVP 제외)
- 실기기에서 `TAP_THRESHOLD` / `MAX_SCALE` / `SPRING_CONFIG` 튜닝
- L3 활성 부위 stroke 강조와 페이드 보간의 상호작용 보정
- 그래프 X축 월 라벨 (현재는 시작/끝 날짜만)
- 실제 인체 일러스트 SVG로 교체 시 `bodyMapLayout.ts`의 도형 좌표만 갈아끼우면 hit-box는 자동 추종

---

## 2026-05-04 — Body Map 줌 UX (L1 → L2 → L3 시트)

### 배경
홈 화면 Body Map이 단일 줌 레벨에서 37개 부위를 동시에 표시 → 막대인간 프로토타입에서는 부위가 너무 작아 가독성·터치 정확도가 떨어짐. `260504_bodymap_zoom_ux_guide.md` 의 3단계 위계 줌(L1 전신 → L2 그룹 → L3 시트)으로 전환.

### 변경 사항
- **추가**: `apps/mobile/constants/bodyMapZoom.ts` — `LEVEL2_GROUPS` (6개 그룹 메타데이터: viewBox + childCodes), `buildGroupSeverityMap`, `viewBoxToString`, `ZoomState` 타입
- **추가**: `apps/mobile/components/bodymap/BodyMapL1.tsx` — 회색 실루엣 + 6개 그룹 박스 오버레이 (히트맵)
- **추가**: `apps/mobile/components/bodymap/BodyMapL2.tsx` — 그룹 확대 뷰. 해당 그룹 L3 부위만 렌더링. 빈 영역 탭 시 onBackgroundPress 호출
- **추가**: `apps/mobile/components/bodymap/renderShape.tsx` — circle/rect/ellipse 공통 렌더 헬퍼
- **수정**: `apps/mobile/components/BodyMap.tsx` — 컨테이너로 슬림화. `zoom` prop 으로 L1/L2 분기, `<Svg>` viewBox 직접 변경으로 줌 구현
- **수정**: `apps/mobile/app/(tabs)/index.tsx` — `zoom` 상태 추가. L2 진입 시 "← 전신 · {그룹명}" 헤더 표시. 빈 영역 탭은 시트가 열려 있으면 시트만 닫고, 없으면 L1 복귀

### 디자인 결정
- **줌 단계는 2단계 SVG (L1 ↔ L2) + 1단계 시트 (L3)** 로 고정. 3단계 SVG 줌은 사용자 피로도 때문에 도입하지 않음.
- **L1에서 37개 부위는 회색 실루엣**으로만 표시하고, 색상은 그룹 단위로만 칠함. 한눈에 "어디가 안 좋은지" 전달이 우선.
- **줌 애니메이션 없음 (즉시 전환)** — MVP 단계. polish 단계에서 viewBox 보간 추가 가능.
- **그룹 viewBox 좌표** — 현재 막대인간 좌표(0 0 200 500) 기준 사각형으로 직접 정의. 일러스트 교체 시 재측정 필요.
- **터치 영역 보장** — 기록 없는 그룹/부위도 탭 가능하도록 `fill="#000" fillOpacity={0.001}` 패턴 사용.

### 동선
```
L1 (전신, 그룹 히트맵)
  ↓ 그룹 탭
L2 (그룹 확대, 부위 표시)
  ├─ 부위 탭 → 하단 시트 오픈 (L2 유지)
  ├─ 빈 영역 탭 → 시트 열려있으면 시트 닫기, 없으면 L1 복귀
  └─ "← 전신" 헤더 탭 → L1 복귀
```

### 영향 범위
- DB / API / shared 타입 변경 없음 (순수 클라이언트 UI)
- 기존 단일 뷰 대비 색칠 로직 결과는 동일 (회귀 없음 — `buildSeverityMap` 그대로 사용)
- 앞/뒤 토글은 L1, L2 모두에서 정상 동작

---

## 2026-05-03 — 탭 네비게이션 도입 (Body Map 기능 1단계)

### 배경
홈 화면을 Body Map(아바타 + 증상 시각화)으로 바꾸기 위해, 기존 기록 리스트 화면을 별도 탭으로 분리.

### 변경 사항
- **추가**: `apps/mobile/app/(tabs)/_layout.tsx` — 하단 탭 네비게이션 ([🏠 홈], [📋 기록])
- **추가**: `apps/mobile/app/(tabs)/index.tsx` — 새 홈 화면 (Body Map 자리, 현재는 placeholder)
- **이동**: 기존 `apps/mobile/app/index.tsx` → `apps/mobile/app/(tabs)/records.tsx` (기록 리스트)
- **수정**: `apps/mobile/app/_layout.tsx` — Stack의 `index` 스크린을 `(tabs)` 그룹으로 교체

### 영향 범위
- 로그인 후 진입 경로 `/` 는 그대로 (expo-router에서 `(tabs)` 그룹은 URL에 노출되지 않음)
- 기록 작성/상세 (`/records/new`, `/records/[id]`) 라우트는 변경 없음

### 다음 단계
- 실제 API 데이터 연결 (지금은 샘플 데이터)
- 좌표 미세 조정 (사용자 피드백 기반)

---

## 2026-05-03 — Body Map 막대인간 프로토타입 (2단계)

### 변경 사항
- **추가**: `apps/mobile/constants/bodyMapLayout.ts` — 37개 부위 SVG 좌표 데이터 + 심각도별 색상
- **추가**: `apps/mobile/components/BodyMap.tsx` — SVG 기반 막대인간 컴포넌트 (앞/뒤 뷰, 부위 탭 콜백)
- **수정**: `apps/mobile/app/(tabs)/index.tsx` — 홈 탭에 BodyMap 연결, 앞/뒤 토글, 부위 탭 시 라벨/심각도 팝업
- **설치**: `react-native-svg@15.12.1`

### 디자인 결정
- viewBox: 200 × 500 (평균 사람 비율)
- 좌우 방향: **거울 모드** — "왼쪽 팔"은 화면 왼쪽에 표시 (사용자가 거울 보듯이)
- 앞면 전용 부위: eye, nose, mouth, skin_face, chest, abdomen, pelvis, genitalia
- 뒷면 전용 부위: back, lower_back, hip
- 양쪽 공유: head, ear, neck, 어깨/팔/다리

### 데이터 흐름 (현재)
```
SAMPLE_SEVERITY (가짜 데이터)
  → BodyMap props
  → SVG 도형 fill 색상 적용
```

---

## 2026-05-03 — 전체 기록 표시 + API findAll 수정 (4단계)

### 변경 사항
- **수정**: `apps/api/src/records/records.service.ts` `findAll` — `select('*')` → `select('*, details:symptom_details(*)')` (details 누락 버그 수정)
- **수정**: `apps/mobile/app/(tabs)/index.tsx` — 오늘 날짜 필터 제거, 모든 기록 통합 표시, 헤더/빈 상태 문구 변경, 디버깅 로그 추가

### 버그
홈 화면에 입력된 증상이 표시되지 않던 원인은 `findAll`이 `details`를 select에서 누락한 것. `findOne`/`findToday`는 정상이었음.

---

## 2026-05-03 — 실제 데이터 연결 + 머리/피부 좌표 조정 (3단계)

### 변경 사항
- **수정**: `bodyMapLayout.ts` — head/skin_face를 ellipse로 변경 (머리 정수리 강조, 피부는 얼굴 영역만)
- **수정**: `(tabs)/index.tsx` — 가짜 데이터 제거, `GET /api/records` 호출 → 오늘 날짜 필터 → 부위별 최대 심각도 채택
- 로딩/빈 상태 처리, 오늘 날짜 헤더 표시

### 데이터 흐름 (현재)
```
화면 진입 (useFocusEffect)
  → GET /api/records (x-user-id 헤더)
  → record_date === 오늘 필터
  → 여러 기록의 부위별 최대 심각도 → severityMap
  → BodyMap props
```
