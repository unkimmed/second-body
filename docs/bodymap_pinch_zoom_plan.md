# Body Map 핀치줌 UX 작업 기획안

> 원본 프롬프트: `~/Desktop/bodymap_ux_prompt.md` (2026-05-08 기획 확정)
> 작성일: 2026-05-08
> 대상 화면: `apps/mobile/app/(tabs)/index.tsx` (홈 — Body Map)

---

## TL;DR (한 줄 요약)

> 지금의 **"L1 그룹 탭 → L2 부위 탭 → 카드"** 구조를, **"한 SVG에서 두 손가락으로 확대 → 일정 배율 넘으면 부위 선택 활성 → 부위 탭하면 바텀시트(그래프 + 기록 리스트 + 증상 추가)"** 구조로 바꿉니다.

핵심 변화 4가지:
1. **줌 방식**: viewBox 즉시 전환 → 핀치 제스처 기반 연속 줌
2. **부위 선택 임계값**: 일정 배율(`TAP_THRESHOLD`) 넘었을 때만 탭 가능 + 진입 순간 햅틱
3. **부위 상세 UI**: 작은 카드 → 풀 바텀시트 (그래프 + 기록 리스트 + 증상 추가 버튼)
4. **증상 기록 진입점**: 별도 화면 라우팅 → 바텀시트에서 부위가 미리 선택된 상태로 시작

---

## 1. 현재 상태 요약

### 1-1. 화면 동작
```
[홈 진입]
  └─ 막대인간 SVG (회색 실루엣 + 6개 그룹 박스 오버레이)
      ├─ 그룹 박스 탭 → viewBox 변경으로 즉시 그룹 확대 (L2)
      │    ├─ 부위 탭 → 화면 하단에 작은 카드 (부위명 + 심각도)
      │    └─ "← 전신" 헤더 탭 → L1 복귀
      └─ 앞면/뒷면 토글
```

### 1-2. 사용 중인 파일
- `app/(tabs)/index.tsx` — 홈 화면 (zoom state, severity fetch)
- `components/BodyMap.tsx` — Svg 컨테이너 (zoom prop으로 L1/L2 분기)
- `components/bodymap/BodyMapL1.tsx` — 회색 실루엣 + 그룹 6개 박스
- `components/bodymap/BodyMapL2.tsx` — 그룹 확대 시 L3 부위만 렌더링
- `components/bodymap/renderShape.tsx` — circle/rect/ellipse 공통 렌더
- `constants/bodyMapLayout.ts` — 37개 부위 도형 좌표 (`VIEW_BOX = 200×500`)
- `constants/bodyMapZoom.ts` — 6개 그룹 viewBox 메타데이터

### 1-3. 설치된 관련 패키지
- ✅ `react-native-gesture-handler` 2.28
- ✅ `react-native-reanimated` 4.1
- ✅ `react-native-svg` 15.12
- ❌ `expo-haptics` — **미설치**, 추가 필요
- ❌ 바텀시트 라이브러리 — 미설치 (선택지: `@gorhom/bottom-sheet` vs 직접 구현)

---

## 2. 변경 후 목표 상태

### 2-1. 줌 레이어
| 레이어 | 진입 | 복귀 | 줌 |
|---|---|---|---|
| L1 (전신) | 홈 진입 / L3 종료 | — | 자유 |
| L2 (탐색) | 핀치 인 | 핀치 아웃 | 자유 |
| L3 (부위 상세) | `TAP_THRESHOLD` 이상에서 부위 탭 | 핀치 아웃 / 시트 닫기 | 잠금 |

`TAP_THRESHOLD = 1.8` (튜닝 가능), `MAX_SCALE = 6`, `MIN_SCALE = 1`

### 2-2. 인터랙션
- **핀치**: 줌인/아웃 (한 손가락 떨어뜨릴 시 1배 미만이면 스프링 복귀)
- **팬**: 두 손가락 (탭과 충돌 방지). L3에선 잠금
- **탭**: scale ≥ TAP_THRESHOLD에서만 hit test 동작
- **햅틱**: 임계값 막 넘는 순간 1회 light impact
- **시각 피드백**: 임계값 부근에서 부위 경계선 stroke opacity 0 → 0.15 페이드인

### 2-3. L3 바텀시트
```
┌──────────────────────────┐
│ [부위명]                 │  헤더 (X 닫기)
├──────────────────────────┤
│ [심각도 추이 그래프]      │  최근 6개월 라인/도트
├──────────────────────────┤
│ [증상 기록 리스트]        │  최신순, 스크롤
│  - 2026-05-04 · 3 · 메모  │
│  - 2026-04-22 · 2 · 메모  │
├──────────────────────────┤
│   [+ 증상 추가]          │  고정 버튼
└──────────────────────────┘
```
빈 상태에서도 동일 레이아웃 (그래프는 빈 축, 리스트는 비어있음, 버튼은 노출).

---

## 3. 프롬프트 코드 검토 — 그대로 쓰지 않을 부분

원본 프롬프트의 코드 스니펫 중 **수정이 필요한 항목**입니다. (그대로 따르면 버그·UX 문제 발생)

### 3-1. 히트박스 좌표계 mismatch ⚠️
- 프롬프트: `viewBox: "0 0 200 400"` 기준 좌표
- 현재 코드: `VIEW_BOX = 200 × 500` (막대인간 5등신)
- **결정**: 프롬프트의 `BODY_PART_HITBOXES` 표는 **참고용**으로만 쓰고, 실제 히트박스는 **기존 `BODY_PART_LAYOUT`의 도형들에서 bounding box를 자동 계산**하도록 함수 작성. (실제 일러스트 SVG 교체 시에도 layout만 갈아끼우면 자동 추종)
- 신규 파일 `constants/bodyPartHitboxes.ts`는 만들되, 내용은 layout으로부터 derived bounding box로 채움.

### 3-2. 두 손가락 팬 강제 (`Gesture.Pan().minPointers(2)`)
- 일반 사용자는 학습 필요 — 한 손가락 팬이 자연스러움
- **결정**:
  - `scale === 1`: 팬 비활성 (전신이 화면에 다 보이므로 굳이 이동 불필요)
  - `scale > 1`: 한 손가락 팬 허용. 탭과 충돌 방지를 위해 `Tap`은 `maxDuration` 짧게 + `maxDistance` 작게.

### 3-3. `getBodyPartAtPoint` 첫 매치 반환 문제
- `Object.entries(BODY_PART_HITBOXES)` 순서로 탐색 → 큰 부위(head)가 먼저 매치되어 작은 부위(eye, mouth)가 절대 잡히지 않음
- **결정**: bounding box 면적 오름차순으로 정렬 후 탐색. 작은 부위 우선.

### 3-4. `isL3Active` 의 worklet/JS 분리
- 원본은 단일 변수 형태로 표현 — UI 스레드 worklet에서 사용 불가
- **결정**:
  - `isL3Active.value`: `useSharedValue<boolean>` (제스처 onUpdate에서 읽기)
  - `isL3Active`: `useState<boolean>` (시트 마운트, JS 분기)
  - 두 개를 동시에 업데이트하는 setter 함수로 추상화

### 3-5. 트래킹 그래프 데이터 소스 ⚠️
- 프롬프트는 그래프 UI만 명시, 데이터 출처 미정
- 현재 API: `GET /api/records` — 전체 기록만 반환. 부위별 6개월 시계열 없음
- **결정 (MVP)**:
  - 클라이언트에서 가공: 이미 받아둔 records 전체에서 `details` 펼쳐서 `(date, severity)` 추출 → 같은 부위 코드로 필터 → 최근 6개월 분만 그래프에 사용.
  - 같은 날 여러 기록이면 max severity 채택 (홈 히트맵과 동일 규칙).
  - **API 신규 엔드포인트 추가는 이번 작업 범위에서 제외**. 차후 데이터 양 늘어나면 재검토.

### 3-6. 트래킹 그래프 라이브러리 선택
- 후보: `victory-native` / `react-native-svg-charts` / 직접 구현
- **결정 (제안)**: `react-native-svg`로 직접 구현. 데이터 점이 많아야 6개월 × 1포인트/일 ≈ 180개, 단순 라인+도트라 라이브러리 도입 비용보다 직접 그리는 게 가벼움. 프로젝트도 이미 svg에 의존.

### 3-7. 바텀시트 라이브러리 선택
- 후보 A: `@gorhom/bottom-sheet` (스냅포인트, 스크롤 통합, 풍부한 기능, 의존성 +1)
- 후보 B: `react-native-reanimated` + `Gesture.Pan`로 직접 구현
- **결정 (제안)**: `@gorhom/bottom-sheet` 채택. L3 안에서 또 모달(+ 증상 추가)이 올라와야 하므로 중첩 시트 처리가 필요한데, 자체 구현은 시간 소모 큼.
- 사용자 컨펌 필요 ⚠️

### 3-8. L1/L2 → 핀치줌 전환 시 "그룹 한눈에 보기" 약화 우려
- 지금은 L1에서 6개 그룹이 색칠되어 "어디가 안 좋은지" 한눈에 보임. 핀치줌으로 가면 부위 단위로 분산되어 시각적 임팩트 감소.
- **결정 (제안)**: L1 (scale = 1) 상태에서는 **부위 단위가 아닌 그룹 단위 색상**(현재 방식) 유지. scale 늘어나면 그룹 색을 페이드아웃 + 부위 색을 페이드인. (페이드 구간: scale 1.0 ~ TAP_THRESHOLD)

### 3-9. 앞면/뒷면 토글 누락
- 프롬프트에는 언급 없으나 현재 기능. 유지 필요.

---

## 4. 작업 단계 (Phase)

각 Phase 끝에 빌드 확인 + 사용자에게 중간 점검 요청.

### Phase 1 — 인프라 준비 (의존성 / 상수)
1. `pnpm add expo-haptics` (mobile)
2. (컨펌 시) `pnpm add @gorhom/bottom-sheet` (mobile)
3. 신규 상수 파일
   - `constants/bodyMapZoomConfig.ts`: `TAP_THRESHOLD`, `MAX_SCALE`, `MIN_SCALE`, `SPRING_CONFIG`
   - `constants/bodyPartHitboxes.ts`: `BODY_PART_LAYOUT`에서 자동 계산한 bounding box + `getBodyPartAtPoint(svgX, svgY)`
   - `constants/severityColors.ts`: 기존 `SEVERITY_FILL` 재사용 (이름만 정리)

### Phase 2 — 핀치줌/팬/탭 제스처 코어
1. `components/BodyMapPinchZoom.tsx` (신규) — `Animated.View` + 제스처 로직
2. 기존 `components/BodyMap.tsx` 슬림화: 이제 단일 SVG (zoom prop 제거)
3. 기존 `BodyMapL1` / `BodyMapL2`는 **단계적으로 통합**:
   - 새 `BodyMapBody` 컴포넌트가 모든 부위 + 그룹 레이어를 함께 렌더
   - 그룹 색칠 fill / 부위 색칠 fill 둘 다 그리고, scale 따라 opacity 보간
4. 햅틱 + 경계선 페이드인 (`useAnimatedReaction` 사용)
5. 검증: 핀치/팬/탭 분리 동작, 임계값 햅틱, scale < 1 스프링 복귀

### Phase 3 — L3 진입/복귀 + 바텀시트 셸
1. `enterL3(partCode)`: scale/translate 스프링 + setActiveBodyPart + 시트 오픈
2. `exitL3()`: scale/translate 스프링 1배 복귀 + 시트 닫기
3. `components/L3Panel.tsx` (신규) — 시트 스켈레톤 (헤더 + 빈 그래프/리스트 placeholder + 추가 버튼)
4. `index.tsx` 통합: 시트는 BodyMapPinchZoom 외부에 배치 (변환 영향 없게)

### Phase 4 — L3 패널 콘텐츠
1. **트래킹 그래프** (`components/bodymap/SeverityChart.tsx`): SVG 라인 + 도트, 6개월 X축, 심각도 1–5 Y축, 빈 상태 = 축만
2. **증상 기록 리스트** (`components/bodymap/PartRecordList.tsx`): records → 해당 부위 detail 추출 → 날짜 내림차순
3. **+ 증상 추가 버튼**: 두 가지 옵션 중 사용자 컨펌 필요 ⚠️
   - (a) 기존 `/records/new` 라우트로 push하면서 `prefilledPart` 쿼리 전달
   - (b) L3 위로 또 다른 시트를 올림 (인라인 입력)
   - 추천: (a)가 빠르고 검증된 흐름. (b)는 추후 polish.

### Phase 5 — 정리 / 폐기
1. 더 이상 안 쓰는 `BodyMapL1`, `BodyMapL2`, `bodyMapZoom.ts` 의 `LEVEL2_GROUPS` 등 점검
2. 그룹 단위 색상은 새 통합 컴포넌트가 처리하므로, `LEVEL2_GROUPS` 의 viewBox 정보는 더 이상 불필요 → 제거 (그룹 색상용 `childCodes` 만 남김)
3. `bodyMapZoom.ts` 의 `ZoomState` 같은 L1/L2 분기 타입 제거
4. `docs/CHANGES.md` 에 본 변경 정리

### Phase 6 — 검증
1. iOS 시뮬레이터에서 핀치/팬/탭 체감 튜닝 (`TAP_THRESHOLD`, `MAX_SCALE`, `SPRING_CONFIG`)
2. 햅틱 한 번만 트리거되는지 (임계값 위아래로 흔들 때 중복 X)
3. L3 진입/복귀 애니메이션 매끄러운지
4. 빈 상태 (기록 0개) UX 확인
5. 앞면/뒷면 토글 정상 동작
6. 사용자가 직접 시연 후 OK 받기 → CHANGES.md 작성 → 커밋

---

## 5. 신규 / 수정 / 삭제 파일

### 신규
- `apps/mobile/components/BodyMapPinchZoom.tsx` — 제스처 컨테이너
- `apps/mobile/components/BodyMapBody.tsx` — 통합 SVG (그룹+부위 레이어)
- `apps/mobile/components/L3Panel.tsx` — 바텀시트 셸
- `apps/mobile/components/bodymap/SeverityChart.tsx` — 6개월 추이 그래프
- `apps/mobile/components/bodymap/PartRecordList.tsx` — 부위별 기록 리스트
- `apps/mobile/constants/bodyMapZoomConfig.ts` — 줌 상수
- `apps/mobile/constants/bodyPartHitboxes.ts` — bbox + hit test
- `apps/mobile/constants/severityColors.ts` — (기존 SEVERITY_FILL 정리)

### 수정
- `apps/mobile/app/(tabs)/index.tsx` — 핀치줌 + 시트 통합으로 재구현
- `apps/mobile/components/BodyMap.tsx` — 슬림화 또는 삭제
- `apps/mobile/constants/bodyMapZoom.ts` — viewBox 메타 제거, 그룹↔부위 매핑만 유지
- `apps/mobile/app/_layout.tsx` — `GestureHandlerRootView` 확인 (이미 있으면 유지)
- `apps/mobile/package.json` — `expo-haptics`, (옵션) `@gorhom/bottom-sheet`

### 삭제 후보
- `apps/mobile/components/bodymap/BodyMapL1.tsx` (기능이 BodyMapBody로 통합됨)
- `apps/mobile/components/bodymap/BodyMapL2.tsx` (동일)

---

## 6. 위험 요소 / 주의사항

| 항목 | 위험 | 대응 |
|---|---|---|
| Reanimated worklet ↔ JS 동기화 | shared value와 state 불일치 시 시트가 잘못 열림 | 단일 setter 함수로 두 값 동시 갱신 |
| iOS 시뮬레이터 핀치 | 마우스로는 핀치 불편 → 옵션+드래그 학습 필요 | 실기기 또는 시뮬레이터 단축키로 검증 |
| 햅틱 중복 트리거 | scale이 임계값 부근 진동하면 햅틱 연속 발생 | `useAnimatedReaction`의 prev 값 비교 (이미 프롬프트에 포함) |
| L3 시트 + 핀치 동시 | 시트 위 제스처가 줌까지 전파되면 어색 | 시트는 GestureDetector 외부에 배치 (프롬프트 명시 사항) |
| 그래프 데이터 가공 비용 | 기록 많아지면 부위별 필터링 매번 비쌈 | `useMemo` + 의존성을 records로 한정. 이번 작업 범위는 OK. |
| Expo Web 호환 | 핀치/햅틱은 web에서 동작 안 함 | 웹은 보조 — 모바일 우선. 깨지지만 않게 fallback. |

---

## 7. 확정 사항 (2026-05-08 사용자 답변)

1. **바텀시트 라이브러리** → ✅ `@gorhom/bottom-sheet` 채택
2. **+ 증상 추가 흐름** → ✅ **인라인 시트** (L3 시트 위에 또 시트 올림. `/records/new` 라우트로 이동 X)
3. **L1 색칠 방식** → ✅ **처음부터 부위 단위 색칠만** (그룹 색칠 레이어/페이드 보간 불필요 — 프롬프트 원안)
4. **L3 종료 동작** → ✅ **L3 → 직전 자유줌(L2) 상태로 복귀**. L3는 줌 잠금만 풀고 scale/translate는 진입 직전 값으로. 이후 사용자가 핀치로 자유 조작 (오므리면 L1까지 자연스럽게 돌아감)
5. **PR 분할** → ✅ **전체 Phase 1–6을 한 PR로**

### 결정에 따른 작업 단순화
- Phase 2: `BodyMapBody`에서 그룹 색상 레이어 / 페이드 보간 로직 **제거**. 부위 색칠 한 가지만 그림.
- Phase 3: `exitL3()`는 시트 close + `isL3Locked = false`만. scale/translate는 `enterL3()` 직전 값으로 스프링 복귀 (`prevScale`, `prevTranslate` 저장 필요).
- Phase 4: `+ 증상 추가` = `@gorhom/bottom-sheet` 중첩 시트로 인라인 폼. 폼 내용 = 부위(고정 표시) + 심각도 슬라이더 + 메모 + 저장 버튼. 저장 시 `POST /api/records` 직접 호출 → L3 패널 그래프/리스트 즉시 갱신.

---

## 8. 작업 외 (이번 PR에서 안 함)

- 실제 인체 일러스트 SVG 교체 (별도 작업, 좌표만 갈아끼우면 됨)
- 부위별 기록 API 신규 엔드포인트 (클라이언트 가공으로 충분)
- 그래프에 트렌드 비교 / 평균선 등 부가 시각화
- 시트의 푸시 알림/공유 등 부가 기능

---

*작성: Claude Opus 4.7 — 사용자 검토 후 작업 시작 예정.*
