import React from "react";
import { Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
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

// startFrom defaults to TRACK_RESUME_FROM for beat-sync; pass TRACK_ACT3_BEAT to skip pre-roll
const MusicAct3: React.FC<{ frames: number; startFrom?: number }> = ({ frames, startFrom = TRACK_RESUME_FROM }) => {
  const frame = useCurrentFrame();
  // Concave (t²) ease-in: slow start, ramps up quickly
  const fadeLinear = interpolate(frame, [0, 45], [0, 1], { extrapolateRight: "clamp" });
  const fadeIn  = fadeLinear * fadeLinear;
  const fadeOut = interpolate(frame, [frames - 3, frames], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
    <Audio
      src={staticFile("music/track.mp3")}
      startFrom={startFrom}
      volume={fadeIn * fadeOut * 0.65}
    />
  );
};

// variant="scratch": vinyl rewind masks the seam; beat-sync always lands at act3Start
const ContrarianMusicScratch: React.FC<{ act1Duration: number; act2Duration: number; act3Duration: number }> = ({
  act1Duration, act2Duration, act3Duration,
}) => {
  const act3Start = act1Duration + act2Duration;
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
      {/* Act 3: track resumes RESUME_EARLY frames early; beat lands on act3Start */}
      <Sequence from={resumeAt} durationInFrames={act3Seg}><MusicAct3 frames={act3Seg} /></Sequence>
    </>
  );
};

// variant="through": music plays straight from start, no beat-sync complexity
// Act3 duration is set externally (durationInFrames) so video ends exactly with music
const ContrarianMusicThrough: React.FC<{ totalDuration: number }> = ({ totalDuration }) => {
  const frame = useCurrentFrame();
  const vol = interpolate(frame, [totalDuration - 3, totalDuration], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return <Audio src={staticFile("music/track.mp3")} volume={vol * 0.65} />;
};

// variant="through-scratch": full volume Act1+Act2, scratch at Act2 end, Act3 music starts at beat directly
// No RESUME_EARLY pre-roll — scratch bridges the gap, concave fade-in hides the hard start
const ContrarianMusicThroughScratch: React.FC<{ act1Duration: number; act2Duration: number; act3Duration: number }> = ({
  act1Duration, act2Duration, act3Duration,
}) => {
  const act3Start = act1Duration + act2Duration;
  return (
    <>
      {/* Full volume through Act1+Act2, hard stop just before scratch */}
      <Sequence from={0} durationInFrames={act3Start - 5}>
        <Audio src={staticFile("music/track.mp3")} volume={0.65} />
      </Sequence>
      {/* Scratch straddles Act2/Act3 boundary (-15f to +22f) */}
      <Sequence from={act3Start - 15} durationInFrames={37}><MusicVinyl /></Sequence>
      {/* Act3: start directly at beat position, no pre-roll */}
      <Sequence from={act3Start} durationInFrames={act3Duration}>
        <MusicAct3 frames={act3Duration} startFrom={TRACK_ACT3_BEAT} />
      </Sequence>
    </>
  );
};

// Slide1: quote fades in immediately (eye-catcher), Aha. time-offset below
const Act1: React.FC<{ post: Post; act1Duration: number }> = ({ post, act1Duration }) => {
  const frame = useCurrentFrame();
  const accent = post.accentColor ?? WIAI_YELLOW;

  // Quote appears right away — this is what draws the eye
  const quoteOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  // Aha. enters at local frame 75, punchline moment
  const bigOpacity = interpolate(frame, [75, 90], [0, 1], { extrapolateRight: "clamp" });
  // Text fade-out: last 11 frames of Act1 (dynamic, works for any act1Duration)
  const textFadeOut = interpolate(frame, [act1Duration - 11, act1Duration - 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <SlideFrame accentColor={accent}>
      <LedWall accentColor={accent} exitAtFrame={act1Duration - 20} />
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
        totalDuration={dur}
        subtextStartFrame={80}
        absenderStartFrame={155}
      />
    </SlideFrame>
  );
};

const ACT3_DURATION = 295; // constant — enough for punchline + mic-drop

export const Contrarian: React.FC<{ post: Post }> = ({ post }) => {
  const { durationInFrames } = useVideoConfig();
  const act1Duration = post.timing?.act1Duration ?? 150;
  const variant      = post.timing?.variant      ?? "scratch";
  const act2Duration = computeAct2Duration(post.slide2.text);
  const act3Start    = act1Duration + act2Duration;
  // "through": fill remaining frames so video ends exactly when music ends
  const act3Duration = variant === "through" ? durationInFrames - act3Start : ACT3_DURATION;
  const totalDuration = act3Start + act3Duration;
  return (
    <>
      {variant === "through"
        ? <ContrarianMusicThrough totalDuration={totalDuration} />
        : variant === "through-scratch"
          ? <ContrarianMusicThroughScratch act1Duration={act1Duration} act2Duration={act2Duration} act3Duration={act3Duration} />
          : <ContrarianMusicScratch act1Duration={act1Duration} act2Duration={act2Duration} act3Duration={act3Duration} />
      }
      <Sequence from={0}            durationInFrames={act1Duration}><Act1 post={post} act1Duration={act1Duration} /></Sequence>
      <Sequence from={act1Duration}  durationInFrames={act2Duration}><Act2 post={post} /></Sequence>
      <Sequence from={act3Start}    durationInFrames={act3Duration}><Act3 post={post} dur={act3Duration} /></Sequence>
    </>
  );
};
