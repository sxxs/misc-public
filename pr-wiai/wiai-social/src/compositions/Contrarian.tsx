import React from "react";
import { Audio, Sequence, staticFile, useCurrentFrame, interpolate } from "remotion";
import { Post } from "../types";
import { WIAI_YELLOW } from "../styles/colors";
import { spaceGroteskFamily } from "../styles/fonts";
import { computeAct2Duration } from "../utils/timing";
import { SlideFrame } from "../components/SlideFrame";
import { GlitchText } from "../components/GlitchText";
import { DirtyCutout } from "../components/DirtyCutout";
import { TypewriterText } from "../components/TypewriterText";
import { LedWall } from "../components/LedWall";
import { PunchlineSlide } from "../components/PunchlineSlide";

// ── Music sync constants ──────────────────────────────────────────────────────
// Beat in the track that originally fell at act3Start (frame 225 = 7.5s).
// We resume the track RESUME_EARLY frames before Act3, always at TRACK_RESUME_FROM,
// so the beat lands on Act3 start regardless of Act2 length.
const TRACK_ACT3_BEAT = 225;
const RESUME_EARLY = 74;
const TRACK_RESUME_FROM = TRACK_ACT3_BEAT - RESUME_EARLY; // = 151

// Music fades slowly from full to 0 over Act1+Act2
const MusicAct1: React.FC<{ act2FadeEnd: number }> = ({ act2FadeEnd }) => {
  const frame = useCurrentFrame();
  const vol = interpolate(
    frame,
    [0,    act2FadeEnd, act2FadeEnd + 10],
    [0.65, 0.40,        0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return <Audio src={staticFile("music/track.mp3")} volume={vol} />;
};

// Vinyl rewind: 37f = 1.23s — centered on Act1→Act2 transition
const MusicVinyl: React.FC = () => (
  <Audio src={staticFile("music/vinyl-rewind.mp3")} volume={0.85} />
);

const MusicRiser: React.FC<{ fadeOutStart: number; fadeOutEnd: number }> = ({ fadeOutStart, fadeOutEnd }) => {
  const frame = useCurrentFrame();
  const vol = interpolate(frame, [fadeOutStart, fadeOutEnd], [0.70, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return <Audio src={staticFile("music/riser.mp3")} volume={vol} />;
};

const MusicAct3: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame();
  // Concave (t²) ease-in: slow start, ramps up quickly toward beat
  const fadeLinear = interpolate(frame, [0, 45], [0, 1], { extrapolateRight: "clamp" });
  const fadeIn  = fadeLinear * fadeLinear;
  const fadeOut = interpolate(frame, [frames - 3, frames], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
    <Audio
      src={staticFile("music/track.mp3")}
      startFrom={TRACK_RESUME_FROM}
      volume={fadeIn * fadeOut * 0.65}
    />
  );
};

const ContrarianMusic: React.FC<{ act2Duration: number; act3Duration: number }> = ({
  act2Duration, act3Duration,
}) => {
  const act3Start = 150 + act2Duration;
  const resumeAt  = act3Start - RESUME_EARLY;
  const act3Seg   = act3Duration + RESUME_EARLY;
  return (
    <>
      {/* Main track: slow fade 0.65→0 over Act1+Act2, done 15f before resume */}
      <Sequence from={0} durationInFrames={resumeAt - 5}>
        <MusicAct1 act2FadeEnd={resumeAt - 15} />
      </Sequence>
      {/* Vinyl rewind: masks the seam where music rewinds and restarts at resumeAt */}
      <Sequence from={resumeAt - 15} durationInFrames={37}><MusicVinyl /></Sequence>
      {/* Riser disabled — <Sequence from={60} durationInFrames={resumeAt + 45 - 30}>
        <MusicRiser fadeOutStart={resumeAt - 30} fadeOutEnd={resumeAt + 45 - 30} />
      </Sequence> */}
      {/* Act 3: track resumes RESUME_EARLY frames early; beat lands on act3Start */}
      <Sequence from={resumeAt} durationInFrames={act3Seg}><MusicAct3 frames={act3Seg} /></Sequence>
    </>
  );
};

// Slide1: quote fades in immediately (eye-catcher), Aha. time-offset below
const Act1: React.FC<{ post: Post }> = ({ post }) => {
  const frame = useCurrentFrame();
  const accent = post.accentColor ?? WIAI_YELLOW;

  // Quote appears right away — this is what draws the eye
  const quoteOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  // Aha. enters at local frame 75 (= global 75), punchline moment
  const bigOpacity = interpolate(frame, [75, 90], [0, 1], { extrapolateRight: "clamp" });
  // Text fade-out at transition to Act2 (last 11f of 150f sequence)
  const textFadeOut = interpolate(frame, [139, 149], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <SlideFrame accentColor={accent}>
      <LedWall accentColor={accent} exitAtFrame={130} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          // Shift content slightly above vertical center by adding more bottom padding
          padding: "180px 240px 500px 60px",
          gap: 44,
          position: "relative",
          zIndex: 5,
          opacity: textFadeOut,
        }}
      >
        {/* Setup quote — per-line bounding boxes, content-width */}
        {post.slide1.smallText && (
          <div style={{ opacity: quoteOpacity, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0 }}>
            {`\u201C${post.slide1.smallText}\u201D`.split("\n").map((line, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(10,10,10,0.85)",
                  padding: "12px 26px 14px",
                  color: "rgba(255,255,255,0.90)",
                  fontSize: 72,
                  fontWeight: 700,
                  fontFamily: spaceGroteskFamily,
                  lineHeight: 1.2,
                  width: "fit-content",
                  maxWidth: 756,
                  whiteSpace: "pre-wrap",
                }}
              >
                {line}
              </div>
            ))}
          </div>
        )}

        {/* Contrarian reaction — even bigger, time-offset */}
        <div style={{ opacity: bigOpacity }}>
          <GlitchText
            text={post.slide1.bigText}
            fontSize={240}
            glitchStartFrame={46}
            glitchEndFrame={58}
          />
        </div>
      </div>
    </SlideFrame>
  );
};

const Act2: React.FC<{ post: Post }> = ({ post }) => {
  const frame = useCurrentFrame();
  const accent = post.accentColor ?? WIAI_YELLOW;
  const enterProgress = interpolate(frame, [2, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SlideFrame accentColor={accent}>
      <LedWall accentColor={accent} mode="s2" />
      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 60px", position: "relative", zIndex: 5 }}>
        <DirtyCutout accentColor={accent} enterProgress={enterProgress}>
          <TypewriterText text={post.slide2.text} startFrame={10} blinkLastPeriod />
        </DirtyCutout>
      </div>
    </SlideFrame>
  );
};

const Act3: React.FC<{ post: Post; dur: number }> = ({ post, dur }) => {
  const accent = post.accentColor ?? WIAI_YELLOW;
  return (
    <SlideFrame accentColor={accent}>
      <PunchlineSlide
        accentColor={accent}
        text={post.slide3.text}
        button={post.slide3.button}
        übrigensText={post.slide3.übrigensText}
        url={post.slide3.url}
        showAbsender={post.isAd}
        totalDuration={dur}
        subtextStartFrame={80}
        absenderStartFrame={155}
      />
    </SlideFrame>
  );
};

const ACT3_DURATION = 295; // constant — enough for punchline + mic-drop

export const Contrarian: React.FC<{ post: Post }> = ({ post }) => {
  const act2Duration = computeAct2Duration(post.slide2.text);
  const act3Start    = 150 + act2Duration;
  return (
    <>
      <ContrarianMusic act2Duration={act2Duration} act3Duration={ACT3_DURATION} />
      <Sequence from={0}         durationInFrames={150}><Act1 post={post} /></Sequence>
      <Sequence from={150}       durationInFrames={act2Duration}><Act2 post={post} /></Sequence>
      <Sequence from={act3Start} durationInFrames={ACT3_DURATION}><Act3 post={post} dur={ACT3_DURATION} /></Sequence>
    </>
  );
};
