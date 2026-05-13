import { useMemo } from "react";
import { View } from "react-native";
import Svg, {
  Circle,
  G,
  Line,
  Polyline,
  Text as SvgText,
} from "react-native-svg";
import { BodyPartCode, Severity, SymptomRecord } from "@second-body/shared";
import { SEVERITY_FILL } from "../../constants/bodyMapLayout";
import { Colors } from "../../constants/theme";

const CHART_WIDTH = 320;
const CHART_HEIGHT = 160;
const PADDING = { top: 12, right: 14, bottom: 26, left: 28 };
const PLOT_W = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_H = CHART_HEIGHT - PADDING.top - PADDING.bottom;
const RANGE_DAYS = 180;

type Props = {
  records: SymptomRecord[];
  activePart: BodyPartCode | null;
};

type Point = {
  x: number;
  y: number;
  severity: Severity;
  date: string;
};

function formatMonthDay(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function SeverityChart({ records, activePart }: Props) {
  const { points, startLabel, endLabel } = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - RANGE_DAYS);

    const labels = {
      startLabel: formatMonthDay(start),
      endLabel: formatMonthDay(now),
    };

    if (!activePart) return { points: [], ...labels };

    // 같은 날짜에 여러 detail 있으면 max severity 사용
    const byDate = new Map<string, Severity>();
    for (const r of records) {
      const d = new Date(r.record_date);
      if (d < start || d > now) continue;
      for (const detail of r.details ?? []) {
        if (detail.body_part_code !== activePart) continue;
        const prev = byDate.get(r.record_date);
        if (!prev || detail.severity > prev) {
          byDate.set(r.record_date, detail.severity);
        }
      }
    }

    const pts: Point[] = [];
    byDate.forEach((severity, dateStr) => {
      const d = new Date(dateStr);
      const dayOffset =
        (d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      pts.push({
        x: PADDING.left + (dayOffset / RANGE_DAYS) * PLOT_W,
        // severity 1 → 바닥, 5 → 천장
        y: PADDING.top + (1 - (severity - 1) / 4) * PLOT_H,
        severity,
        date: dateStr,
      });
    });
    pts.sort((a, b) => a.date.localeCompare(b.date));
    return { points: pts, ...labels };
  }, [records, activePart]);

  const yTicks: Severity[] = [1, 2, 3, 4, 5];

  return (
    <View>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Y축 grid + 라벨 */}
        {yTicks.map((tick) => {
          const y = PADDING.top + (1 - (tick - 1) / 4) * PLOT_H;
          return (
            <G key={tick}>
              <Line
                x1={PADDING.left}
                y1={y}
                x2={CHART_WIDTH - PADDING.right}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth={1}
              />
              <SvgText
                x={PADDING.left - 6}
                y={y + 3}
                fontSize={9}
                fill="#9ca3af"
                textAnchor="end"
              >
                {tick}
              </SvgText>
            </G>
          );
        })}

        {/* X축 라인 */}
        <Line
          x1={PADDING.left}
          y1={CHART_HEIGHT - PADDING.bottom}
          x2={CHART_WIDTH - PADDING.right}
          y2={CHART_HEIGHT - PADDING.bottom}
          stroke="#9ca3af"
          strokeWidth={1}
        />

        {/* X축 라벨 */}
        <SvgText
          x={PADDING.left}
          y={CHART_HEIGHT - 6}
          fontSize={9}
          fill="#9ca3af"
        >
          {startLabel}
        </SvgText>
        <SvgText
          x={CHART_WIDTH - PADDING.right}
          y={CHART_HEIGHT - 6}
          fontSize={9}
          fill="#9ca3af"
          textAnchor="end"
        >
          {endLabel}
        </SvgText>

        {/* 데이터: 라인 + 도트 */}
        {points.length >= 2 && (
          <Polyline
            points={points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke={Colors.primary}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        )}
        {points.map((p, i) => (
          <Circle
            key={`${p.date}-${i}`}
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill={SEVERITY_FILL[p.severity]}
            stroke={Colors.surface}
            strokeWidth={1}
          />
        ))}
      </Svg>
    </View>
  );
}
