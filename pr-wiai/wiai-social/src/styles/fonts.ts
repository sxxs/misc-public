import { loadFont as loadRubik } from "@remotion/google-fonts/Rubik";
import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";

// Font comparison branch: Rubik (body/headlines) + IBM Plex Mono (mono elements)
export const { fontFamily: spaceGroteskFamily } = loadRubik("normal", {
  weights: ["700"],
  subsets: ["latin"],
});

export const { fontFamily: spaceMonoFamily } = loadIBMPlexMono("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});
