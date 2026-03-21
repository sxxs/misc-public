import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadSpaceMono } from "@remotion/google-fonts/SpaceMono";

export const { fontFamily: spaceGroteskFamily } = loadSpaceGrotesk("normal", {
  weights: ["700"],
  subsets: ["latin"],
});

export const { fontFamily: spaceMonoFamily } = loadSpaceMono("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});
