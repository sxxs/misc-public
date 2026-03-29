import React from "react";
import { Audio, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Post } from "../types";
import { Newsjacking } from "./Newsjacking";
import { Nachtgedanke } from "./Nachtgedanke";
import { WusstestDu } from "./WusstestDu";
import { LedWallComposition as LedWall } from "./LedWall";
import { Selbstironie } from "./Selbstironie";
import { Witz } from "./Witz";
import { Terminal } from "./Terminal";
import { Billboard } from "./Billboard";
import { Slideshow } from "./Slideshow";
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
  const withMusic = (node: React.ReactNode) =>
    post.music !== false ? <><BackgroundMusic />{node}</> : <>{node}</>;

  const content = (() => {
    switch (post.type) {
      case "newsjacking":
        return withMusic(<Newsjacking post={post} />);
      case "nachtgedanke":
        return withMusic(<Nachtgedanke post={post} />);
      case "wusstest-du":
        return withMusic(<WusstestDu post={post} />);
      case "led-wall":
        return <LedWall post={post} />;
      case "selbstironie":
        return withMusic(<Selbstironie post={post} />);
      case "witz":
        return withMusic(<Witz post={post} />);
      case "terminal":
        return withMusic(<Terminal post={post} />);
      case "billboard":
        return withMusic(<Billboard post={post} />);
      case "slideshow":
        return <Slideshow post={post} />;
      default: {
        const _exhaustive: never = post.type;
        return null;
      }
    }
  })();
  return <>{content}<SafeZoneOverlay /></>;
};
