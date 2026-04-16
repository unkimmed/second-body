import { BodyPart, Severity } from "@second-body/shared";

export const BODY_PART_LABELS: Record<BodyPart, string> = {
  head: "머리",
  chest: "가슴",
  abdomen: "복부",
  back: "허리/등",
  arm: "팔",
  leg: "다리",
  skin: "피부",
  other: "기타",
};

/** 심각도별 배경색 (Tailwind 클래스) */
export const SEVERITY_COLOR: Record<Severity, string> = {
  1: "bg-green-400",
  2: "bg-lime-400",
  3: "bg-yellow-400",
  4: "bg-orange-400",
  5: "bg-red-500",
};
