import React from "react";
import { useCurrentFrame } from "remotion";
import { parseTypewriterLines, getVisibleLineCount } from "../utils/timing";
import { spaceGroteskFamily } from "../styles/fonts";

interface Props {
  text: string;
  fontSize?: number;
  startFrame?: number;
  framesPerLine?: number;
  color?: string;
  lineBackground?: string; // if set, each line gets its own tight bounding box
  blinkLastPeriod?: boolean; // blink the final "." once all text is visible
}

const BLINK_PERIOD = 45; // 1.5s at 30fps

export const TypewriterText: React.FC<Props> = ({
  text,
  fontSize = 78,
  startFrame = 10,
  framesPerLine = 3,
  color = "#0A0A0A",
  lineBackground,
  blinkLastPeriod = false,
}) => {
  const frame = useCurrentFrame();
  const lines = parseTypewriterLines(text);
  const visibleCount = getVisibleLineCount(lines, frame, startFrame, framesPerLine);

  const allVisible = visibleCount >= lines.length;
  const lastNonBlankIdx = lines.reduce((last, l, i) => (!l.isBlank ? i : last), -1);
  const blinkOpacity = allVisible && blinkLastPeriod
    ? (Math.sin(frame * Math.PI * 2 / BLINK_PERIOD) + 1) / 2
    : 1;

  // Padding scales with font size; slight bottom > top for optical balance
  const padV = Math.round(fontSize * 0.15);
  const padH = Math.round(fontSize * 0.28);

  return (
    <div
      style={{
        fontFamily: spaceGroteskFamily,
        fontSize,
        fontWeight: 700,
        lineHeight: 1.18,
        color,
        letterSpacing: "-0.01em",
        ...(lineBackground
          ? { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0 }
          : { whiteSpace: "pre-wrap" }),
      }}
    >
      {lines.slice(0, visibleCount).map((line, i) => {
        if (line.isBlank) {
          return <div key={i} style={{ height: lineBackground ? "0.35em" : "0.5em" }} />;
        }
        // Blink the trailing period on the last non-blank line once all text is visible
        const isBlinkLine = blinkLastPeriod && allVisible && i === lastNonBlankIdx;
        const hasDot = isBlinkLine && line.text.endsWith(".");
        const mainText = hasDot ? line.text.slice(0, -1) : line.text;
        const dotSpan = hasDot
          ? <span style={{ opacity: blinkOpacity }}>.</span>
          : null;

        if (lineBackground) {
          return (
            <div
              key={i}
              style={{
                background: lineBackground,
                padding: `${padV}px ${padH}px ${Math.round(padV * 1.1)}px`,
                whiteSpace: "nowrap",
              }}
            >
              {mainText}{dotSpan}
            </div>
          );
        }
        return <div key={i}>{mainText}{dotSpan}</div>;
      })}
    </div>
  );
};
