import React from "react";
import { Audio, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Post } from "../types";
import { Newsjacking } from "./Newsjacking";
import { Nachtgedanke } from "./Nachtgedanke";
import { WusstestDu } from "./WusstestDu";
import { Contrarian } from "./Contrarian";
import { Selbstironie } from "./Selbstironie";
import { Witz } from "./Witz";
import { SafeZoneOverlay } from "../components/SafeZoneOverlay";

const BackgroundMusic: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fadeOut = interpolate(frame, [durationInFrames - 3, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Audio
      src={staticFile("music/track.mp3")}
      volume={fadeOut * 0.65}
    />
  );
};

export const WiaiPost: React.FC<Post> = (post) => {
  const content = (() => {
    switch (post.type) {
      case "newsjacking":
        return <><BackgroundMusic /><Newsjacking post={post} /></>;
      case "nachtgedanke":
        return <><BackgroundMusic /><Nachtgedanke post={post} /></>;
      case "wusstest-du":
        return <><BackgroundMusic /><WusstestDu post={post} /></>;
      case "contrarian":
        return <Contrarian post={post} />;
      case "selbstironie":
        return <><BackgroundMusic /><Selbstironie post={post} /></>;
      case "witz":
        return <><BackgroundMusic /><Witz post={post} /></>;
      default: {
        const _exhaustive: never = post.type;
        return null;
      }
    }
  })();
  return <>{content}<SafeZoneOverlay /></>;
};
