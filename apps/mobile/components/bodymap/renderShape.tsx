import { Circle, Rect, Ellipse } from "react-native-svg";
import { ShapeDef } from "../../constants/bodyMapLayout";

type Options = {
  fill: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
};

export function renderShape(shape: ShapeDef, key: number, opts: Options) {
  const {
    fill,
    fillOpacity = 1,
    stroke = "#374151",
    strokeWidth = 0.8,
  } = opts;

  if (shape.type === "circle") {
    return (
      <Circle
        key={key}
        cx={shape.cx}
        cy={shape.cy}
        r={shape.r}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }
  if (shape.type === "rect") {
    return (
      <Rect
        key={key}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        rx={shape.rx ?? 0}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }
  return (
    <Ellipse
      key={key}
      cx={shape.cx}
      cy={shape.cy}
      rx={shape.rx}
      ry={shape.ry}
      fill={fill}
      fillOpacity={fillOpacity}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
}
