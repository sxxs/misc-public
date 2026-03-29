import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { TerminalFlowBlock } from "../types";
import { TERMINAL_GREEN, TERMINAL_AMBER } from "../styles/colors";
import { spaceMonoFamily } from "../styles/fonts";
import {
  TERMINAL_FLOW_PROMPT_PHASE,
  buildTypingSchedule,
  scheduleFrames,
  TypingAction,
} from "../utils/timing";

function resolveColor(color?: "green" | "amber" | "white"): string {
  if (color === "amber") return TERMINAL_AMBER;
  if (color === "white") return "#ffffff";
  return TERMINAL_GREEN;
}

// Replay the typing schedule up to `elapsed` frames → visible text string
function replaySchedule(actions: TypingAction[], elapsed: number): string {
  let text = "";
  let t = 0;

  for (const a of actions) {
    if (t >= elapsed) break;

    switch (a.t) {
      case "c": // correct char
        text += a.ch;
        t += a.dur;
        break;
      case "w": // wrong char (typo) — show it if we're within its duration
        if (t + a.dur > elapsed) {
          text += a.ch; // mid-typo: wrong char visible
          return text;
        }
        text += a.ch;
        t += a.dur;
        break;
      case "b": // backspace
        if (t + a.dur > elapsed) {
          // mid-backspace: char already gone (instant visual)
          text = text.slice(0, -1);
          return text;
        }
        text = text.slice(0, -1);
        t += a.dur;
        break;
      case "p": // pause
        if (t + a.dur > elapsed) return text;
        t += a.dur;
        break;
    }
  }

  return text;
}

// Pre-compute per-block schedules and timeline offsets
interface BlockSchedule {
  schedule: TypingAction[];
  offset: number;       // absolute frame start
  color: string;
  isPause: boolean;
  pauseDur: number;
}

function buildTimeline(blocks: TerminalFlowBlock[], baseColor: string): BlockSchedule[] {
  const result: BlockSchedule[] = [];
  let cursor = TERMINAL_FLOW_PROMPT_PHASE;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.pause != null) {
      result.push({ schedule: [], offset: cursor, color: baseColor, isPause: true, pauseDur: block.pause });
      cursor += block.pause;
    } else {
      const sched = buildTypingSchedule(block.text, 42 + i * 7);
      const color = resolveColor(block.color) || baseColor;
      result.push({ schedule: sched, offset: cursor, color, isPause: false, pauseDur: 0 });
      cursor += scheduleFrames(sched);
    }
  }

  return result;
}

interface RenderedSpan {
  text: string;
  color: string;
}

export const TerminalFlow: React.FC<{
  blocks: TerminalFlowBlock[];
  baseColor: string;
  prompt: string;
}> = ({ blocks, baseColor, prompt }) => {
  const frame = useCurrentFrame();

  const timeline = useMemo(
    () => buildTimeline(blocks, baseColor),
    [blocks, baseColor],
  );

  // Build visible text as colored spans
  const spans: RenderedSpan[] = [];

  for (const entry of timeline) {
    if (entry.isPause) continue;
    const localFrame = frame - entry.offset;
    if (localFrame < 0) break;

    const visibleText = replaySchedule(entry.schedule, localFrame);
    if (visibleText) {
      spans.push({ text: visibleText, color: entry.color });
    }

    // If we haven't finished this block, stop
    const totalFrames = scheduleFrames(entry.schedule);
    if (localFrame < totalFrames) break;
  }

  const cursorOn = frame % 16 < 8;
  const promptOpacity = Math.min(1, frame / 15);
  const cursorColor = spans.length > 0 ? spans[spans.length - 1].color : baseColor;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "140px 108px 400px 108px",
        overflow: "hidden",
      }}
    >
      {/* Prompt */}
      <div
        style={{
          fontFamily: spaceMonoFamily,
          fontSize: 48,
          fontWeight: 400,
          color: baseColor,
          lineHeight: 1.6,
          textShadow: `0 0 20px ${baseColor}26`,
          opacity: promptOpacity,
          marginBottom: 32,
          flexShrink: 0,
        }}
      >
        {prompt}
      </div>

      {/* Text flow */}
      <div
        style={{
          fontFamily: spaceMonoFamily,
          fontSize: 52,
          fontWeight: 400,
          lineHeight: 1.6,
          letterSpacing: "-0.01em",
          whiteSpace: "pre-wrap",
          overflow: "hidden",
        }}
      >
        {spans.map((span, i) => (
          <span
            key={i}
            style={{
              color: span.color,
              textShadow: `0 0 20px ${span.color}26`,
            }}
          >
            {span.text}
          </span>
        ))}
        <span
          style={{
            color: cursorColor,
            opacity: cursorOn ? 1 : 0,
            textShadow: `0 0 20px ${cursorColor}26`,
          }}
        >
          {"\u2588"}
        </span>
      </div>
    </div>
  );
};
