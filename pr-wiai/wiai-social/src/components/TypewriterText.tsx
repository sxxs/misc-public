import React from "react";
import { useCurrentFrame } from "remotion";
import { parseTypewriterLines, getVisibleLineCount } from "../utils/timing";
import { spaceGroteskFamily } from "../styles/fonts";

interface Props {
  text: string;
  fontSize?: number;
  startFrame?: number;
  color?: string;
}

export const TypewriterText: React.FC<Props> = ({
  text,
  fontSize = 78,
  startFrame = 10,
  color = "#0A0A0A",
}) => {
  const frame = useCurrentFrame();
  const lines = parseTypewriterLines(text);
  const visibleCount = getVisibleLineCount(lines, frame, startFrame);

  return (
    <div
      style={{
        fontFamily: spaceGroteskFamily,
        fontSize,
        fontWeight: 700,
        lineHeight: 1.18,
        color,
        letterSpacing: "-0.01em",
        whiteSpace: "pre-wrap",
      }}
    >
      {lines.slice(0, visibleCount).map((line, i) => (
        <div key={i} style={{ minHeight: line.isBlank ? "0.5em" : undefined }}>
          {line.isBlank ? "\u00A0" : line.text}
        </div>
      ))}
    </div>
  );
};
