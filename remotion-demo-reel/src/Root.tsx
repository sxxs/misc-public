import React from "react";
import { Composition } from "remotion";
import { DemoReel } from "./DemoReel";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DemoReel"
        component={DemoReel}
        durationInFrames={1080}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
