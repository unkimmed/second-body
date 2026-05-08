# Second Body — 서비스 아키텍처

> 작성일: 2026-05-04
> 범위: 전체 서비스 (DB · API · 모바일 앱 · UI)

---

## 📖 목차

1. [서비스 개요](#1-서비스-개요)
2. [전체 시스템 구조](#2-전체-시스템-구조)
3. [모노레포 구조](#3-모노레포-구조)
4. [데이터베이스 스키마](#4-데이터베이스-스키마)
5. [API 명세](#5-api-명세)
6. [모바일 앱 — 화면 / 네비게이션](#6-모바일-앱--화면--네비게이션)
7. [UI/UX 디자인 시스템](#7-uiux-디자인-시스템)
8. [데이터 흐름](#8-데이터-흐름)
9. [인증 흐름](#9-인증-흐름)
10. [기술 스택](#10-기술-스택)
11. [환경 변수](#11-환경-변수)
12. [알려진 한계점](#12-알려진-한계점)

---

## 1. 서비스 개요

**Second Body**는 사용자가 매일 자신의 신체 부위별 증상을 기록하고, 시각적으로 확인할 수 있는 헬스 트래킹 앱이다.

### 핵심 가치
- 매일 부위별 증상(통증/불편)을 1~5단계 심각도로 기록
- 누적된 증상을 **인체 아바타 위에 색상으로 시각화** (Body Map)
- 자신의 몸 상태 패턴을 한눈에 파악

### 주요 기능
- 회원가입 / 로그인
- 증상 기록 작성·조회·삭제
- Body Map 홈 화면 (앞면 / 뒷면 토글, 부위 탭 → 상세 정보)
- 기록 리스트 보기

---

## 2. 전체 시스템 구조

```
┌─────────────────────────────────┐
│  📱 모바일 앱 (React Native)      │
│   - Expo Router 라우팅            │
│   - NativeWind 스타일링           │
└──────┬──────────────────┬───────┘
       │                  │
       │ Auth             │ Data API
       │ (직접)           │ (x-user-id 헤더)
       ↓                  ↓
┌─────────────────┐  ┌─────────────────────┐
│ 🔐 Supabase Auth │  │ 🖥️ NestJS API       │
│   - JWT 발급      │  │   - REST endpoints  │
│   - 세션 관리     │  │   - DTO validation  │
└──────┬──────────┘  └──────┬──────────────┘
       │                    │
       │ auth.users          │ service_role 키
       │                    │ (RLS 우회)
       ↓                    ↓
┌─────────────────────────────────┐
│  🗄️ PostgreSQL (Supabase Cloud)  │
│   - users, avatars               │
│   - body_parts (마스터 데이터)    │
│   - symptom_records, _details    │
│   - RLS 정책 활성화              │
└─────────────────────────────────┘
```

---

## 3. 모노레포 구조

`pnpm` 워크스페이스로 3개 패키지를 함께 관리.

```
second-body/
├── apps/
│   ├── api/                 ← NestJS 백엔드
│   └── mobile/              ← Expo React Native 앱
├── packages/
│   └── shared/              ← 공통 TypeScript 타입
├── supabase/
│   └── schema.sql           ← DB 스키마 정의
├── docs/                    ← 문서
│   ├── CHANGES.md
│   ├── code-review.md
│   └── architecture.md      ← (이 파일)
├── CLAUDE.md                ← Claude 작업 지침
└── package.json             ← 워크스페이스 루트
```

### 패키지 간 관계

```
shared (타입만 정의)
   ↑           ↑
   │           │
  api ←── 호출 ── mobile
```

`shared` 패키지의 타입을 수정하면 `pnpm shared:build` 로 컴파일 후 다른 앱이 사용 가능.

---

## 4. 데이터베이스 스키마

### 테이블 관계도

```
auth.users (Supabase 내장)
    │ 1:1
    ↓
public.users ────────────────────┐
    │ 1:1                         │ 1:N
    ↓                             ↓
public.avatars            public.symptom_records
                                  │ 1:N
                                  ↓
                          public.symptom_details
                                  │ N:1
                                  ↓
                          public.body_parts (마스터)
```

### 테이블 상세

#### `body_parts` — 신체 부위 마스터 (총 44개, 읽기 전용)
계층 구조: L1 (전신) → L2 (그룹 6개) → L3 (실제 부위 37개)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `code` | TEXT (PK) | 부위 코드 (예: `left_wrist`) |
| `name_ko` | TEXT | 한글명 (예: "손목") |
| `level` | INT | 1, 2, 3 |
| `parent_code` | TEXT (FK) | 상위 부위 |
| `side` | TEXT | left / right / center |
| `svg_path_id` | TEXT | SVG path id (UI용) |
| `display_order` | INT | 정렬 순서 |

**L2 그룹 (6개):** head_neck, left_arm, right_arm, torso, left_leg, right_leg

**L3 (37개):**
- 머리·목 (7): head, eye, nose, mouth, ear, skin_face, neck
- 왼팔 (6): left_shoulder, upper_arm, elbow, forearm, wrist, hand
- 오른팔 (6): 동일 구조
- 몸통 (7): chest, abdomen, back, lower_back, pelvis, hip, genitalia
- 왼다리 (5): left_thigh, knee, calf, ankle, foot
- 오른다리 (5): 동일 구조

#### `users` — 앱 사용자
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | UUID (PK, FK→auth.users) | Supabase Auth 사용자 ID |
| `email` | TEXT | 이메일 (unique) |
| `created_at`, `updated_at` | TIMESTAMPTZ | 생성/수정 시각 |

#### `avatars` — 사용자별 아바타 (1:1)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `user_id` | UUID (PK, FK) | 사용자 ID |
| `avatar_name` | TEXT | 아바타 이름 |
| `skin_tone` | TEXT | light / medium_light / medium / medium_dark / dark |
| `gender` | TEXT | male / female |

#### `symptom_records` — 기록 헤더
하루 여러 기록 가능 (unique 제약 없음).

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | UUID (PK) | 기록 ID |
| `user_id` | UUID (FK) | 작성자 |
| `record_date` | DATE | 기록 날짜 |
| `overall_note` | TEXT | 전체 메모 (선택) |

#### `symptom_details` — 부위별 증상 (실제 데이터)
한 기록 안에 여러 부위 증상 포함.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | UUID (PK) | |
| `record_id` | UUID (FK→records) | 부모 기록 |
| `body_part_code` | TEXT (FK→body_parts) | 부위 코드 |
| `severity` | SMALLINT (1~5) | 심각도 |
| `note` | TEXT | 부위별 메모 (선택) |

### 인덱스

- `idx_symptom_records_user_date` — 달력 뷰 / 오늘 기록 조회 최적화
- `idx_symptom_details_record_id` — 기록 상세 조회
- `idx_symptom_details_body_part` — 부위별 집계 (히트맵)

### 트리거
모든 테이블에 `updated_at` 자동 갱신 트리거.

### Row Level Security (RLS)
- 활성화: 모든 테이블
- 정책: 사용자는 본인 데이터만 접근 가능
- API는 `service_role` 키로 RLS 우회 (서버 측 신뢰)

---

## 5. API 명세

베이스 URL: `http://localhost:3001/api` (개발)

모든 인증 필요 엔드포인트는 `x-user-id` 헤더 필요.

### Records

| Method | Path | 설명 | Body |
|---|---|---|---|
| GET | `/records` | 전체 기록 (details 포함) | - |
| GET | `/records/today` | 오늘 기록만 (details 포함) | - |
| GET | `/records/:id` | 단일 기록 | - |
| POST | `/records` | 새 기록 작성 | `CreateRecordDto` |
| PATCH | `/records/:id` | 기록 수정 | `UpdateRecordDto` |
| DELETE | `/records/:id` | 기록 삭제 | - |

#### `CreateRecordDto`
```ts
{
  record_date: string,        // "YYYY-MM-DD"
  overall_note?: string,
  details: [
    {
      body_part_code: BodyPartCode,
      severity: 1 | 2 | 3 | 4 | 5,
      note?: string,
    }
  ]
}
```

### Body Parts

| Method | Path | 설명 |
|---|---|---|
| GET | `/body-parts` | 전체 부위 마스터 데이터 |

### 글로벌 설정 (`apps/api/src/main.ts`)
- 모든 경로 prefix: `/api`
- CORS 허용
- DTO 자동 검증 (`ValidationPipe`, `whitelist: true`, `transform: true`)

---

## 6. 모바일 앱 — 화면 / 네비게이션

### 라우팅 구조 (Expo Router 파일 기반)

```
app/
├── _layout.tsx              ← 루트: AuthProvider + 인증 가드
│
├── login.tsx                ← 로그인 화면
├── signup.tsx               ← 회원가입 화면
│
├── (tabs)/                  ← 인증 후 진입 (하단 탭)
│   ├── _layout.tsx          ← 탭 네비게이터 [🏠 홈] [📋 기록]
│   ├── index.tsx            ← 홈 (Body Map)
│   └── records.tsx          ← 기록 리스트
│
└── records/                 ← 탭 외부 스크린 (스택)
    ├── new.tsx              ← 새 기록 작성
    └── [id].tsx             ← 기록 상세 / 삭제
```

### 화면별 기능

#### 🔐 로그인 / 회원가입
- 이메일 + 비밀번호 (6자 이상)
- 회원가입 시 추가 입력: 이름, 아바타 이름, 성별
- 가입 후 자동으로 `users`, `avatars` 테이블에 행 생성
- 이메일 인증 활성화된 경우 안내 후 로그인 화면으로

#### 🏠 홈 (Body Map)
- **상단:** "내 몸 상태" / 안내 문구
- **앞/뒤 토글:** 앞면 ↔ 뒷면
- **막대인간 SVG:** `react-native-svg`로 도형 조합 (현재 임시), 37개 부위 각각 좌표 정의됨
- **색칠:** 모든 기록의 부위별 최대 심각도를 색상으로 표시 (1=초록 ~ 5=빨강)
- **부위 탭:** 하단 카드에 부위명 + 심각도 표시
- **빈 상태:** "기록된 증상이 없어요"

#### 📋 기록 리스트
- 날짜 내림차순 카드 리스트
- 카드: 좌측 색바(최대 심각도) + 날짜 + 부위 칩(최대 3개) + 메모 미리보기
- 우측 상단 로그아웃 버튼
- 우하단 플로팅 (+) → 새 기록 작성

#### ✏️ 새 기록 작성
- 날짜 입력 (기본 오늘)
- 전체 메모 (선택)
- 부위 추가 영역:
  - 37개 부위 칩 중 선택
  - 심각도 슬라이더 (1~5)
  - 부위별 메모 (선택)
  - "+ 부위 추가" 버튼으로 리스트에 누적
- 같은 부위 중복 차단 (동일 기록 안에서)
- 최소 1개 부위 필수
- 저장 시 `POST /records` → 직전 화면으로 복귀

#### 📄 기록 상세
- 헤더: 날짜 + 전체 메모 (배경색 = 최대 심각도 색)
- 부위별 증상 리스트 (좌측 색바 + 부위명 + 심각도 + 메모)
- 하단 빨간 버튼: 기록 삭제 (확인 모달)

---

## 7. UI/UX 디자인 시스템

### 디자인 컨셉
**"Tactical Calm — The Living Sanctuary"** (Soft Minimalism)

### 색상 (Color Palette)
- **베이스:** 크림색 `#fbf9f5` (절대 흰색 아님)
- **카드:** 화이트 `#ffffff` (크림 위에서 두드러짐)
- **Primary:** 무거운 블루 `#456373` (강조 / CTA)
- **본문:** `#31332f` (절대 100% 검정 아님)
- **부속 텍스트:** `#5e605b`
- **Severity:**
  - 1 → 초록 `#4ade80`
  - 2 → 라임 `#a3e635`
  - 3 → 노랑 `#facc15`
  - 4 → 주황 `#fb923c`
  - 5 → 빨강 `#ef4444`

### 폰트
- **Pretendard Variable** (한국어 최적화)
- TextStyle 토큰: displayLg → labelSm 까지 12단계
- 정의 파일: `apps/mobile/constants/theme.ts`

### Spacing / Radius
- Spacing: xs(4) → 6xl(80)
- Radius: **md(8) 이상** — 0px radius 금지(디자인 DNA)
- 카드 기본: lg(32), 버튼: xl(48), 칩: full(pill)

### Shadow
- 그림자보다 **톤 단계로 깊이감** 표현
- ambient shadow는 floating element(모달, toast)에만

### 컴포넌트 프리셋
- `CardPreset.base` / `inset` / `emphasis`
- `Gradient.primary` (CTA용)
- `Glass` (반투명 네비게이션)

### 스타일링 방식
- **NativeWind** (Tailwind CSS for React Native)
- 일부 동적 스타일은 inline `style` prop

### 이미지 / 아이콘
- 현재 탭 아이콘: 이모지 (🏠, 📋) — 임시
- 부위 일러스트: 미설치 (현재 SVG 막대인간 프로토타입)

---

## 8. 데이터 흐름

### 새 기록 작성
```
사용자 입력
  ↓
mobile: POST /api/records  (x-user-id 헤더)
  ↓
api: ValidationPipe (DTO 검증)
  ↓
api: RecordsService.create
  ↓
Supabase: INSERT symptom_records
  ↓
Supabase: INSERT symptom_details (여러 행)
  ↓
api: findOne으로 details 포함 결과 반환
  ↓
mobile: router.back()
```

### Body Map 색칠
```
홈 탭 진입 (useFocusEffect)
  ↓
GET /api/records  (x-user-id 헤더)
  ↓
api: findAll → details 포함하여 반환
  ↓
mobile: buildSeverityMap(records)
       → 부위별 최대 심각도 추출
  ↓
BodyMap 컴포넌트:
  - 37개 부위 좌표 순회
  - severityMap[code] 가 있으면 해당 색상으로 fill
  - 없으면 기본 회색
```

---

## 9. 인증 흐름

### 회원가입
```
사용자 입력 (이메일/PW/이름/아바타/성별)
  ↓
supabase.auth.signUp()  → auth.users 생성
  ↓
[세션 발급된 경우]
  ↓
public.users INSERT (id, email)
  ↓
public.avatars INSERT (user_id, avatar_name, gender)
  ↓
onAuthStateChange → _layout.tsx 가 홈으로 이동
```

### 로그인
```
사용자 입력 (이메일/PW)
  ↓
supabase.auth.signInWithPassword()
  ↓
세션 발급 → AuthContext.session 갱신
  ↓
_layout.tsx 가 홈 탭으로 자동 이동
```

### 라우팅 가드 (`apps/mobile/app/_layout.tsx`)
```ts
if (!session && !inAuthScreen) → /login으로
if (session && inAuthScreen)   → / 으로
```

### API 호출 시 인증
- 모바일 앱이 헤더에 `x-user-id: <session.user.id>` 추가
- ⚠️ **임시 인증** — JWT 검증 미구현 (보안 취약, 출시 전 교체 필요)

---

## 10. 기술 스택

### 프론트엔드 (모바일)
- **React Native** 0.81 / **Expo SDK** 54
- **Expo Router** 6 (파일 기반 라우팅)
- **TypeScript** 5
- **NativeWind** 4 (Tailwind for RN)
- **react-native-svg** 15 (Body Map 렌더링)
- **@supabase/supabase-js** 2 (Auth + Storage)
- **AsyncStorage** (네이티브 세션 저장)
- **Pretendard Variable** (폰트)

### 백엔드 (API)
- **NestJS** (Node.js 프레임워크)
- **TypeScript**
- **class-validator / class-transformer** (DTO 검증)
- **@supabase/supabase-js** (service_role)
- **@nestjs/config** (env 관리)

### 데이터베이스 / 인증
- **Supabase Cloud** (PostgreSQL 호스팅 + Auth)
- **PostgreSQL** with Row Level Security
- 확장: `pgcrypto` (`gen_random_uuid()`)

### 도구
- **pnpm** workspaces (모노레포)
- 테스트 / 린트 — 미설정

---

## 11. 환경 변수

### API (`apps/api/.env`)
| 변수 | 용도 |
|---|---|
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 풀권한 키 (절대 노출 금지) |
| `PORT` | 서버 포트 (기본 3001) |

### 모바일 (`apps/mobile/.env`)
| 변수 | 용도 |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 anon 키 |
| `EXPO_PUBLIC_API_URL` | API 엔드포인트 (기본 `http://localhost:3001/api`) |

`EXPO_PUBLIC_*` 접두어는 클라이언트 번들에 포함됨 (공개됨).

---

## 12. 알려진 한계점

> 자세한 항목은 [code-review.md](./code-review.md) 참조.

### 보안
- **인증 우회 가능**: `x-user-id` 헤더가 검증 없이 신뢰됨 (출시 전 JWT 검증 필요)
- 환경변수 누락 시 친절한 에러 없음

### 데이터 무결성
- `update()` 메서드의 details 재삽입은 트랜잭션 보호 없음 → 부분 실패 시 데이터 손실 가능
- 회원가입 시 users / avatars 인서트가 부분 실패하면 좀비 상태

### 코드 품질
- API 호출 코드 4군데 중복 (`apiFetch` 함수 미추출)
- 에러 처리 방식 3가지 혼재 (Alert / 화면 박스 / console)
- 타입 단언(`as`) 남용 — 런타임 검증 부재

### UX
- 탭 헤더 중복 가능성 (records.tsx 자체 헤더 + 탭 헤더)
- 새 기록 저장 후 홈 탭으로 이동 안 함
- 로그아웃 버튼이 기록 탭에만 위치

### 시각화
- BodyMap은 막대인간 프로토타입 — 일러스트 SVG 교체 필요
- 좌우 방향: 거울 모드 (사용자 기준 = 화면 동일 방향)

### 인프라
- 테스트 / 린트 미설정
- 로깅 시스템 미구축 (개발자 콘솔만)

---

> 본 문서는 코드 변경 시 **수동 동기화** 필요. CLAUDE.md, CHANGES.md, code-review.md 와 함께 관리.
