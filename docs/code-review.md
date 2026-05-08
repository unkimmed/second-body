# 코드 리뷰 결과

> 작성일: 2026-05-04
> 범위: `apps/api`, `apps/mobile`, `packages/shared` 전체

---

## 🔴 긴급 (보안 / 심각한 버그)

### 1. 인증 우회 가능 — 보안 취약점

**위치:** `apps/api/src/records/records.controller.ts`, `apps/mobile/app/**/*.tsx`

**현재:** 클라이언트가 `x-user-id` 헤더에 본인 ID를 적어서 보내면, 서버가 그걸 그대로 믿는다.

**왜 문제:** 누군가 다른 사람의 user_id만 알면 → API에 그 헤더 넣어서 **남의 기록을 마음대로 조회/삭제**할 수 있음.

```
👤 공격자: GET /api/records  with x-user-id: 다른사람UUID
🖥️ 서버: "OK, 여기 있어요" (의심 없이 반환)
```

**해결 방향:** Supabase가 발급하는 **JWT 토큰**을 헤더에 넣고, 서버에서 토큰 검증 후 user_id 추출.

> CLAUDE.md에도 "Auth is temporary"라고 명시되어 있지만, 실제 사용자 받기 전 **반드시 처리** 필요.

---

### 2. 기록 수정 시 데이터가 날아갈 수 있음

**위치:** `apps/api/src/records/records.service.ts` `update()` 메서드

```ts
// 1. 기존 details 먼저 삭제
await supabase.from('symptom_details').delete()...
// 2. 그 다음 새 details 삽입
await supabase.from('symptom_details').insert(...)
```

**문제:** 1번 성공 → 2번 실패 시 → 모든 부위 정보가 사라지고 복구 불가.

**해결:** Supabase RPC로 트랜잭션 묶거나, 적어도 실패 시 백업으로 복원.

> 📖 트랜잭션: "전부 성공하거나 전부 실패해야 한다"는 보장.

---

### 3. 기록 상세 화면의 에러 처리 부재

**위치:** `apps/mobile/app/records/[id].tsx` line 32-41

```ts
fetch(...).then((r) => r.json()).then((data) => setRecord(data))
```

**문제:** API가 404나 500 에러를 반환해도 그 응답을 그대로 `record` 에 저장 → 화면이 깨진 데이터로 렌더됨.

**해결:** `if (!r.ok)` 체크 추가.

---

## 🟡 중요 (효율성 / 품질)

### 4. API 호출 코드 중복 (4군데)

같은 패턴이 4개 화면에 반복:

```ts
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001/api";
fetch(`${API_URL}/records`, { headers: { "x-user-id": userId! } })
```

**위치:**
- `apps/mobile/app/(tabs)/index.tsx`
- `apps/mobile/app/(tabs)/records.tsx`
- `apps/mobile/app/records/new.tsx`
- `apps/mobile/app/records/[id].tsx`

**해결:** `apps/mobile/lib/api.ts` 파일 만들어서 `apiFetch()` 함수로 통합.

**효과:**
- API URL 변경 시 한 군데만 수정
- 헤더/에러 처리 일관성
- 인증 방식 변경 시(1번 해결할 때) 한 군데만 수정

---

### 5. 헤더 두 번 표시 가능성

**위치:** `apps/mobile/app/(tabs)/_layout.tsx` (탭 헤더 활성화) + `apps/mobile/app/(tabs)/records.tsx` (자체 헤더)

탭 네비게이터가 자동으로 헤더를 만드는데, records.tsx 안에도 자체 헤더(`bg-primary px-5 pb-6 pt-4`)가 있음. → 화면에 보라색 헤더가 두 개 보일 수 있음.

**해결:** 둘 중 하나만 사용. 자체 헤더가 더 디자인 풍부하니 탭 헤더는 끄는 게 좋음.

```ts
// (tabs)/_layout.tsx 의 records 스크린에:
options={{ headerShown: false, ... }}
```

---

### 6. 에러 응답 일관성 부족

같은 앱 안에서 에러를 3가지 방식으로 처리:
- `login.tsx`, `signup.tsx`: `Alert.alert(...)` 팝업
- `records/new.tsx`, `records/[id].tsx`: `setErrorMessage()` 화면 박스
- `(tabs)/records.tsx`: `console.error()` 만 (사용자에게 안 보임)

**해결:** 한 가지로 통일. 토스트(toast) 라이브러리 도입 고려.

---

### 7. 타입 단언(`as`) 남용

```ts
const data = (await res.json()) as SymptomRecord[]
```

**문제:** API가 잘못된 데이터 반환해도 `as`로 단언만 하므로 런타임에 화면 깨짐.

**해결 (장기):** zod 같은 라이브러리로 런타임 검증.

---

### 8. records.controller에서 userId 헤더 검증 없음

`x-user-id` 헤더가 빈 값이거나 누락되어도 그대로 통과 → DB에서 빈 결과 또는 오류.

**해결:** NestJS Guard 추가해서 헤더 검증.

---

## 🟢 제안 (개선)

### 9. 로그아웃 버튼 위치

현재 **기록 탭**에만 있음. 보통은 별도 **설정/프로필 화면**에 두는 게 일반적.

### 10. 새 기록 저장 후 동작

`router.back()` → 직전 화면(기록 탭)으로 돌아옴. 사용자가 BodyMap을 보려면 한 번 더 탭 전환 필요.

**개선:** 저장 후 홈 탭으로 자동 이동.

### 11. 환경변수 누락 시 무방비

```ts
process.env.EXPO_PUBLIC_SUPABASE_URL!  // ! 로 단언
```

`.env` 누락 시 런타임 에러.

**해결:** 앱 시작 시 검증 후 친절한 에러 메시지.

### 12. AuthContext 회원가입 — 부분 실패 처리

```ts
await supabase.from("users").insert(...)
await supabase.from("avatars").insert(...)
```

첫 번째 성공 후 두 번째 실패 시 → 사용자는 있는데 아바타 없는 좀비 상태. 복구 안 됨.

### 13. 디버깅 로그 정리 시점 결정

`(tabs)/index.tsx`에 `console.log` 2개 (현재 의도적으로 유지 중). 배포 전에는 정리 필요.

### 14. 탭 아이콘 — 이모지 사용

🏠 📋 이모지는 OS별로 렌더링 다름. 장기적으로 벡터 아이콘 라이브러리(예: `@expo/vector-icons`) 권장.

### 15. `findToday` API 미사용

서버에 만들어놨지만 클라이언트에서 안 씀. 사용 안 하면 제거하거나, 홈 BodyMap이 "오늘만" 모드를 가질 때 활용.

### 16. 같은 날 같은 부위 중복 기록 정책 모호

- `new.tsx`: 한 기록 안에서 중복 차단
- 하지만 같은 날 새 기록을 만들면 같은 부위 또 가능 (하루 여러 기록 정책)
- → BodyMap에서 "최대 심각도" 채택해서 표시 (현재 동작)
- **결정 필요:** 정책이 의도된 것인지 명시 (CLAUDE.md에 추가)

---

## 📊 우선순위 매트릭스

| 우선순위 | 항목 | 작업량 |
|---|---|---|
| 🔴 즉시 | 1. 인증 (JWT 검증) | 큼 |
| 🔴 즉시 | 2. update 트랜잭션 | 중간 |
| 🔴 즉시 | 3. record/[id] 에러 처리 | 작음 |
| 🟡 곧 | 4. API 호출 통합 | 작음 |
| 🟡 곧 | 5. 헤더 중복 | 작음 |
| 🟡 곧 | 6. 에러 응답 일관성 | 중간 |
| 🟢 여유 시 | 9, 10, 14 (UX 개선) | 작음 |

---

## 🗺️ 추천 작업 순서

### 지금 바로 (15분)
- **3번** (에러 처리)
- **5번** (헤더 중복)

→ 작은데 효과 큼

### 가까운 시일 (1~2시간)
- **4번** (API 통합)
- **6번** (에러 일관성)

### MVP 출시 전 (필수)
- **1번** (인증)
- **2번** (트랜잭션)
