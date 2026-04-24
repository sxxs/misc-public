import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Audio,
  staticFile,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { Post } from "../types";
import { spaceGroteskFamily, spaceMonoFamily } from "../styles/fonts";
import { WIAI_YELLOW } from "../styles/colors";

export const RawPhotoVideo: React.FC<{ post: Post }> = ({ post }) => {
  const rpv = post.rawPhotoVideo!;
  const frame = useCurrentFrame();

  const fadeStart = rpv.videoFadeStart ?? 210;
  const fadeEnd = rpv.videoFadeEnd ?? 240;
  const overlayInFrame = rpv.overlayInFrame ?? 205;
  const overlayFadeFrames = rpv.overlayFadeFrames ?? 18;
  const absenderInFrame = rpv.absenderInFrame ?? 252;
  const absenderFadeFrames = rpv.absenderFadeFrames ?? 22;

  const musicVolume = rpv.musicVolume ?? 0.18;
  const musicFadeOut = rpv.musicFadeOut ?? 30;
  const musicVolumeFaded =
    musicFadeOut > 0
      ? interpolate(
          frame,
          [rpv.totalDuration - musicFadeOut, rpv.totalDuration],
          [musicVolume, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      : musicVolume;

  const videoOpacity = interpolate(frame, [fadeStart, fadeEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const overlayOpacity = interpolate(
    frame,
    [overlayInFrame, overlayInFrame + overlayFadeFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const absenderOpacity = interpolate(
    frame,
    [absenderInFrame, absenderInFrame + absenderFadeFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {videoOpacity > 0.001 && (
        <AbsoluteFill style={{ opacity: videoOpacity }}>
          <OffthreadVideo
            src={staticFile(rpv.src)}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      )}

      {rpv.overlayText && (
        <div
          style={{
            position: "absolute",
            top: rpv.overlayTop ?? 540,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: spaceGroteskFamily,
            fontWeight: 700,
            fontSize: rpv.overlaySize ?? 92,
            color: "#fff",
            letterSpacing: "-0.01em",
            lineHeight: 1.05,
            opacity: overlayOpacity,
            textShadow: "0 2px 18px rgba(0,0,0,0.75)",
            padding: "0 80px",
          }}
        >
          {rpv.overlayText}
        </div>
      )}

      {rpv.absender && (
        <div
          style={{
            position: "absolute",
            top: rpv.absenderTop ?? 1050,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: absenderOpacity,
          }}
        >
          <div
            style={{
              fontFamily: spaceGroteskFamily,
              fontWeight: 700,
              fontSize: 42,
              color: "#fff",
              letterSpacing: "0.02em",
            }}
          >
            {rpv.absender[0]}
          </div>
          <div
            style={{
              marginTop: 14,
              fontFamily: spaceMonoFamily,
              fontWeight: 400,
              fontSize: 36,
              color: WIAI_YELLOW,
              letterSpacing: "0.01em",
            }}
          >
            {rpv.absender[1]}
          </div>
        </div>
      )}

      <Audio src={staticFile(rpv.narrationFile)} />
      {rpv.musicFile && (
        <Audio src={staticFile(rpv.musicFile)} volume={musicVolumeFaded} />
      )}
    </AbsoluteFill>
  );
};
