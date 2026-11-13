# 배포 가이드

Second Body 는 서버가 없는 로컬 우선 앱이다. 데이터는 사용자 기기에만 저장되므로 백엔드·DB 배포는 없다.
(이전의 NestJS API · Supabase 배포 구성은 MOM-35 에서 제거됨. git 기록에만 남아 있다.)

| 구성 | 무엇           | 어디에     | 방식                     |
| ---- | -------------- | ---------- | ------------------------ |
| iOS  | Expo 앱        | App Store  | 출시 준비 중 (추후 작성) |
| Web  | Expo Web (SPA) | **Vercel** | 자동(main push 시)       |

출시 순서는 iOS → Android → 데스크톱 → 웹이다 (CLAUDE.md 참고).

---

## Web 배포 (Vercel)

설정은 레포의 `vercel.json` 에 있다 (install/build/output/rewrite). **main push 시 자동 배포**된다.

1. Vercel → **Add New → Project** → 이 레포 import
2. **Root Directory: 레포 루트**(기본) 유지. Framework Preset: **Other**
3. 환경 변수는 필요 없다. 웹 데이터는 각 브라우저의 IndexedDB 에 저장된다.

**주의**

- SPA 라우팅: `app.json` 의 `"web": { "output": "single" }` + `vercel.json` rewrite(`/(.*) → /index.html`)로 처리 → 동적 경로 새로고침도 정상.
- 웹 데이터는 브라우저에만 있다. 브라우저 데이터를 지우면 기록도 사라진다.

---

## CI — `.github/workflows/ci.yml`

- PR/`main` push에서 **shared 빌드 → shared 테스트 → mobile 타입체크** (회귀 게이트)
- 배포는 하지 않음. 브랜치 보호 규칙에서 이 체크를 필수로 걸면 좋다.
