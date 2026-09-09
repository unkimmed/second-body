# 배포 가이드 (A안: 웹 우선 · NestJS 상주 배포)

이 문서는 **웹 우선** 배포 프로세스를 정의한다. 구성 요소는 4개다.

| 구성 | 무엇 | 어디에 | 방식 |
|---|---|---|---|
| API | NestJS (상주 프로세스) | **Render** Web Service | 수동(Actions → Deploy Hook) |
| Web | Expo Web (SPA) | **Vercel** | 수동(Actions → Deploy Hook) |
| DB | Supabase (PostgreSQL) | Supabase Cloud | 마이그레이션 수동/CLI |
| Shared | 타입 패키지 | (빌드 산출물) | 각 빌드에서 `pnpm shared:build` |

백엔드는 Render(상주형), 프론트는 Vercel(정적/SPA)로 **분리**한다.

---

## 0. 사전 준비 (1회)

- Render 계정 + GitHub 레포 연결
- Supabase 프로젝트(현재 사용 중) 접근 권한
- 확보해 둘 값:
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Settings → API)
  - `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

## 1. DB 마이그레이션 (배포 전에 먼저)

스키마 변경은 **앱/서버 배포보다 먼저** 반영해야 한다(구버전 코드가 신컬럼을 안 써도 안전, 신버전이 구스키마를 만나면 에러).

현재는 대시보드 SQL 에디터로 `supabase/migrations/*.sql` 을 순서대로 실행한다.
향후 CLI로 정식화하려면:

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref <project-ref>          # URL의 <ref>
supabase migration repair --status applied <이미 적용된 타임스탬프>   # 수동 적용분 표시
supabase db push                                    # 미적용 마이그레이션만 반영
```

> 규칙: **스키마 변경 → 마이그레이션 파일 추가 → 리뷰/머지 → DB push → 코드 배포** 순서.

---

## 2. API 배포 (Render Web Service)

1. Render → **New → Blueprint** → 레포 선택 → `render.yaml` 감지
2. `second-body-api` 서비스의 시크릿 입력:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. 배포 완료 후 URL 확인: `https://second-body-api.onrender.com`
   - 헬스 확인: `GET /api/body-parts` 가 200 이면 정상
4. **Deploy Hook 발급**: 서비스 → Settings → Deploy Hook → URL 복사
   → GitHub 레포 Settings → Secrets → `RENDER_DEPLOY_HOOK_API` 로 저장
5. 이후 배포는 **Render 자동배포가 아니라 GitHub Actions 가 트리거**한다(아래 4번 참고).
   Blueprint 의 `autoDeploy: false` 로 Render 쪽 자동배포는 꺼져 있음.

**빌드가 하는 일**: `pnpm install` → `shared:build`(타입 컴파일) → `api:build`(`nest build` → `apps/api/dist`) → `node apps/api/dist/main.js` 로 상주 실행.

> 무료 티어는 15분 미사용 시 슬립 → 첫 요청 콜드스타트(수십 초). 상시 가동은 유료 플랜.

---

## 3. Web 배포 (Vercel)

설정은 레포의 `vercel.json` 에 있다 (install/build/output/rewrite + `git.deploymentEnabled:false` 로 push 자동배포 끔 → 수동 전용).

1. Vercel → **Add New → Project** → 이 레포 import
2. **Root Directory: 레포 루트**(기본) 유지. Framework Preset: **Other**
   (build/output/install 은 `vercel.json` 이 지정하므로 대시보드에서 비워둬도 됨)
3. **Environment Variables** 입력:
   - `EXPO_PUBLIC_API_URL` = `https://second-body-api.onrender.com/api` (2번 API URL + `/api`)
   - `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
4. **Settings → Git → Deploy Hooks** 에서 Hook 생성 → URL 복사
5. 배포 → `https://<project>.vercel.app`

**주의**
- `EXPO_PUBLIC_*` 값은 **빌드 시 번들에 박힌다.** 값 변경 시 **재배포(재빌드)** 필요.
- SPA 라우팅: `app.json` 의 `"web": { "output": "single" }` + `vercel.json` rewrite(`/(.*) → /index.html`)로 처리 → 동적 경로 새로고침도 정상.
- CORS: 현재 API 는 `enableCors()`(전체 허용). 공개 전엔 Vercel 도메인만 허용하도록 좁히는 것을 권장.

---

## 4. CI 와 배포 (분리)

배포는 **자동이 아니라 수동 버튼**으로만 실행된다.

### CI — `.github/workflows/ci.yml`
- PR/`main` push에서 **shared 빌드 → API·mobile 타입체크 → API 빌드** (회귀 게이트)
- 배포는 하지 않음. 브랜치 보호 규칙에서 이 체크를 필수로 걸면 좋다.

### 수동 배포 — `.github/workflows/deploy.yml`
- GitHub → **Actions → "Deploy (manual)" → Run workflow** 버튼으로 실행
- `service` 드롭다운에서 `both` / `api` / `web` 선택 → 해당 서비스의 Render Deploy Hook 호출

**필요 시크릿** (레포 Settings → Secrets and variables → Actions):
- `RENDER_DEPLOY_HOOK_API` — Render API 서비스의 Deploy Hook URL
- `VERCEL_DEPLOY_HOOK_WEB` — Vercel 프로젝트의 Deploy Hook URL

> Deploy Hook 은 "배포 시작"만 트리거하고 완료를 기다리지 않는다. 완료까지 대기/실패 감지가
> 필요하면 각 플랫폼 CLI/Action 으로 교체하면 된다.

---

## 5. 릴리스 흐름 요약

```
feature 브랜치 → PR (CI build 통과) → main 머지
   → (스키마 변경 시) DB 마이그레이션 먼저
   → Actions → "Deploy (manual)" 버튼 → 서비스 선택 → Render 배포
```

---

## ⚠️ 공개 전 반드시 해결할 것 — 인증

현재 인증은 임시다: 앱이 `x-user-id` 헤더로 사용자 ID를 보내고 API가 **그대로 신뢰**한다(`TEMP_USER_ID='user-001'`).
즉 **누구나 헤더만 바꾸면 타인 데이터에 접근** 가능하다. 내부 베타/데모까지는 괜찮지만,
**공개 배포 전에는 Supabase Auth JWT 검증**(API에서 토큰 검증 → user_id 추출)으로 교체해야 한다.

---

## 다음 단계 (선택)

- staging 환경 분리(Supabase 프로젝트 + Render 서비스 별도)
- API `/api/health` 엔드포인트 추가 → Render healthCheckPath 지정
- 커스텀 도메인 + HTTPS
- EAS Build/Submit 도입(모바일 앱 스토어 배포는 웹 안정화 후)
