# Changes

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
