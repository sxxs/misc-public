import React from "react";
import { Composition } from "remotion";
import { WiaiPost } from "./compositions/WiaiPost";
import { Post } from "./types";
import { computeAct2Duration } from "./utils/timing";

// ── Post data — single source of truth: edit the JSON files in posts/ ─────────
import contrarianoerhaengePost from "../posts/contrarian-vorhange.json";
import mathe3Post               from "../posts/2026-mathe3.json";
import kiGesagtPost             from "../posts/2026-ki-gesagt.json";
import passtNichtPost           from "../posts/2026-passt-nicht.json";
import bambirdsPost             from "../posts/2026-bambirds.json";
import kiFailsPost              from "../posts/2026-ki-fails.json";
import kiJobsPost               from "../posts/2026-03-21-ki-jobs.json";
import nachtgedankePost         from "../posts/test-nachtgedanke.json";
import witzPost                 from "../posts/test-witz.json";

const contrarianDuration = (post: Post) => 150 + computeAct2Duration(post.slide2.text) + 295;

export const Root: React.FC = () => (
  <>
    <Composition
      id="WiaiPost"
      component={WiaiPost as unknown as React.ComponentType<Record<string, unknown>>}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={kiJobsPost as unknown as Post}
    />
    <Composition
      id="WiaiPost-nachtgedanke"
      component={WiaiPost as unknown as React.ComponentType<Record<string, unknown>>}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={nachtgedankePost as unknown as Post}
    />
    <Composition
      id="WiaiPost-witz"
      component={WiaiPost as unknown as React.ComponentType<Record<string, unknown>>}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={witzPost as unknown as Post}
    />
    <Composition
      id="WiaiPost-contrarian"
      component={WiaiPost as unknown as React.ComponentType<Record<string, unknown>>}
      durationInFrames={contrarianDuration(contrarianoerhaengePost as unknown as Post)}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={contrarianoerhaengePost as unknown as Post}
    />
    <Composition
      id="WiaiPost-mathe3"
      component={WiaiPost as unknown as React.ComponentType<Record<string, unknown>>}
      durationInFrames={contrarianDuration(mathe3Post as unknown as Post)}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={mathe3Post as unknown as Post}
    />
    <Composition
      id="WiaiPost-ki-gesagt"
      component={WiaiPost as unknown as React.ComponentType<Record<string, unknown>>}
      durationInFrames={contrarianDuration(kiGesagtPost as unknown as Post)}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={kiGesagtPost as unknown as Post}
    />
    <Composition
      id="WiaiPost-passt-nicht"
      component={WiaiPost as unknown as React.ComponentType<Record<string, unknown>>}
      durationInFrames={contrarianDuration(passtNichtPost as unknown as Post)}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={passtNichtPost as unknown as Post}
    />
    <Composition
      id="WiaiPost-bambirds"
      component={WiaiPost as unknown as React.ComponentType<Record<string, unknown>>}
      durationInFrames={contrarianDuration(bambirdsPost as unknown as Post)}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={bambirdsPost as unknown as Post}
    />
    <Composition
      id="WiaiPost-ki-fails"
      component={WiaiPost as unknown as React.ComponentType<Record<string, unknown>>}
      durationInFrames={contrarianDuration(kiFailsPost as unknown as Post)}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={kiFailsPost as unknown as Post}
    />
  </>
);
