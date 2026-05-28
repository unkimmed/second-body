# CHANGES

## MOM-7

- 바디맵 히트맵 색상을 무지개(초록→빨강) 그라데이션에서 **빨강 단색 + 투명도 5단계**로 변경.
  - 심각도 1은 옅은 빨강(투명도 0.20), 심각도 5는 진한 빨강(투명도 0.90)으로 표시.
  - 변경 파일: `apps/mobile/app/components/bodyMap/BodyFigureSvg.tsx` (`SEVERITY_FILL`, `SEVERITY_STROKE` 두 상수).
  - SymptomSheet의 심각도 선택 칩 색상은 그대로 둠(1~5 구분 UI라서 무지개가 더 적합).
