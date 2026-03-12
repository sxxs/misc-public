import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Intro } from "./Intro";
import { ProjectSlide } from "./ProjectSlide";
import { Transition } from "./Transition";
import { Outro } from "./Outro";
import { projects } from "./data";

const INTRO_DURATION = 90; // 3 seconds
const SLIDE_DURATION = 120; // 4 seconds per project
const TRANSITION_DURATION = 30; // 1 second
const OUTRO_DURATION = 90; // 3 seconds

export const DemoReel: React.FC = () => {
  let currentFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a1a" }}>
      {/* Intro */}
      <Sequence from={0} durationInFrames={INTRO_DURATION}>
        <Intro />
      </Sequence>

      {/* Transition from intro */}
      <Sequence
        from={INTRO_DURATION - TRANSITION_DURATION}
        durationInFrames={TRANSITION_DURATION}
      >
        <Transition color={projects[0].accentColor} />
      </Sequence>

      {/* Project slides with transitions */}
      {projects.map((project, i) => {
        const slideStart = INTRO_DURATION + i * (SLIDE_DURATION + TRANSITION_DURATION);

        return (
          <React.Fragment key={project.title}>
            <Sequence from={slideStart} durationInFrames={SLIDE_DURATION}>
              <ProjectSlide project={project} index={i} />
            </Sequence>

            {/* Transition to next */}
            <Sequence
              from={slideStart + SLIDE_DURATION - TRANSITION_DURATION / 2}
              durationInFrames={TRANSITION_DURATION}
            >
              <Transition
                color={
                  i < projects.length - 1
                    ? projects[i + 1].accentColor
                    : "#a855f7"
                }
              />
            </Sequence>
          </React.Fragment>
        );
      })}

      {/* Outro */}
      <Sequence
        from={
          INTRO_DURATION +
          projects.length * (SLIDE_DURATION + TRANSITION_DURATION)
        }
        durationInFrames={OUTRO_DURATION}
      >
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
