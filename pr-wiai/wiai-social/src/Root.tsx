import React from "react";
import { Composition } from "remotion";
import { WiaiPost } from "./compositions/WiaiPost";
import { Post, ContrarianTiming } from "./types";
import { computeAct2Duration, ACT3_ALT_TRACKS, computeBillboardDuration, computeTerminalDuration } from "./utils/timing";

// ── Post imports (one per JSON file in posts/) ────────────────────────────────
import contrarianoerhaengePost from "../posts/contrarian-vorhange.json";
import mathe3Post               from "../posts/2026-mathe3.json";
import kiGesagtPost             from "../posts/2026-ki-gesagt.json";
import passtNichtPost           from "../posts/2026-passt-nicht.json";
import bambirdsPost             from "../posts/2026-bambirds.json";
import kiFailsPost              from "../posts/2026-ki-fails.json";
import kiJobsPost               from "../posts/2026-03-21-ki-jobs.json";
import nachtgedankePost         from "../posts/test-nachtgedanke.json";
import witzPost                 from "../posts/test-witz.json";
import handfestPost             from "../posts/2026-handfest.json";
import akinatorPost             from "../posts/2026-akinator.json";
import gottesbeweiPost          from "../posts/2026-gottesbeweis.json";
import kiBaldPost               from "../posts/2026-ki-bald.json";
import introHomemadePost        from "../posts/2026-intro-homemade.json";
import introAlterPost           from "../posts/2026-intro-alter.json";
import bierPost                 from "../posts/2026-bier.json";
import workLifePost             from "../posts/2026-work-life.json";
import mietenRauchbierPost      from "../posts/2026-mieten-rauchbier.json";
import chatgptKlausurPost       from "../posts/2026-chatgpt-klausur.json";
import bulimieLernenPost        from "../posts/2026-bulimie-lernen.json";
import taschenrechnerPost       from "../posts/2026-taschenrechner.json";
import wiaiProfsPost            from "../posts/2026-wiai-profs.json";
import maennerfachPost          from "../posts/2026-maennerfach.json";
import tensorTournamentPost     from "../posts/2026-tensor-tournament.json";
import ehrlicheAppsPost         from "../posts/2026-ehrliche-apps.json";
import vorlesungNetflixPost     from "../posts/2026-vorlesung-netflix.json";
import merksteFahrpruefungPost  from "../posts/2026-merkste-fahrpruefung.json";
import merksteNetflixPost       from "../posts/2026-merkste-netflix.json";
import programmierikPost        from "../posts/2026-programmierik.json";
import fakeStatistikPost        from "../posts/2026-fake-statistik.json";
import ikeaPost                 from "../posts/2026-ikea.json";
import metaManipulationPost     from "../posts/2026-meta-manipulation.json";
import siliconValleyPost        from "../posts/2026-silicon-valley.json";
import binarySearchPost         from "../posts/2026-binary-search.json";
import informatikTrockenPost    from "../posts/2026-informatik-trocken.json";
import hackathonNachtPost       from "../posts/2026-hackathon-nacht.json";
import stoppHandyPost           from "../posts/2026-stopp-handy.json";
import merksteSchulePost        from "../posts/2026-merkste-schule.json";
import testBillboardPost        from "../posts/test-billboard.json";
import testTerminalGreenPost    from "../posts/test-terminal-green.json";
import testTerminalAmberPost    from "../posts/test-terminal-amber.json";
import testPixelWallMazePost    from "../posts/test-pixel-wall-maze.json";

// ── Duration helpers ──────────────────────────────────────────────────────────
const TRACK_DURATION = 520; // track.mp3 ~17.3s at 30fps

const contrarianDuration = (post: Post) => {
  const act1 = post.timing?.act1Duration ?? (post.slide1?.bigText ? 150 : 100);
  if (post.timing?.variant === "through") return TRACK_DURATION;
  const alt = post.timing?.act3Track ? ACT3_ALT_TRACKS[post.timing.act3Track] : null;
  const delay = post.timing?.act3MusicDelay ?? 0;
  const act3 = alt ? alt.dur + delay : 295;
  return act1 + computeAct2Duration(post.slide2.text) + act3;
};

// ── Composition factories ─────────────────────────────────────────────────────
const C = WiaiPost as unknown as React.ComponentType<Record<string, unknown>>;
const S = { fps: 30, width: 1080, height: 1920 }; // screen spec

// Duration dispatch by post type
const selectDuration = (post: Post): number => {
  if (post.type === "billboard") return computeBillboardDuration(post);
  if (post.type === "terminal")  return computeTerminalDuration(post);
  return contrarianDuration(post); // contrarian + all legacy types
};

// cp: register a post (timing comes from JSON)
const cp = (id: string, post: Post) => (
  <Composition key={id} id={id} component={C}
    durationInFrames={selectDuration(post)} {...S}
    defaultProps={post as unknown as Record<string, unknown>} />
);

// cv: register a post with a timing override (for A/B experiments)
const cv = (id: string, post: Post, timing: ContrarianTiming) => {
  const p: Post = { ...post, timing };
  return (
    <Composition key={id} id={id} component={C}
      durationInFrames={contrarianDuration(p)} {...S}
      defaultProps={p as unknown as Record<string, unknown>} />
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// To add a new post:
//   1. Create posts/my-post.json  (see GUIDE.md)
//   2. import myPost from "../posts/my-post.json";
//   3. Add {cp("WiaiPost-my-post", myPost as unknown as Post)} below
// ══════════════════════════════════════════════════════════════════════════════

export const Root: React.FC = () => (
  <>
    {/* ── Other composition types (fixed 450f duration) ──────────────────── */}
    <Composition id="WiaiPost" component={C} durationInFrames={450} {...S}
      defaultProps={kiJobsPost as unknown as Post} />
    <Composition id="WiaiPost-nachtgedanke" component={C} durationInFrames={450} {...S}
      defaultProps={nachtgedankePost as unknown as Post} />
    <Composition id="WiaiPost-witz" component={C} durationInFrames={450} {...S}
      defaultProps={witzPost as unknown as Post} />

    {/* ── Contrarian posts ───────────────────────────────────────────────── */}
    {cp("WiaiPost-contrarian",      contrarianoerhaengePost as unknown as Post)}
    {cp("WiaiPost-mathe3",          mathe3Post              as unknown as Post)}
    {cp("WiaiPost-ki-gesagt",       kiGesagtPost            as unknown as Post)}
    {cp("WiaiPost-passt-nicht",     passtNichtPost          as unknown as Post)}
    {cp("WiaiPost-bambirds",        bambirdsPost            as unknown as Post)}
    {cp("WiaiPost-ki-fails",        kiFailsPost             as unknown as Post)}
    {cp("WiaiPost-handfest",        handfestPost            as unknown as Post)}
    {cp("WiaiPost-akinator",        akinatorPost            as unknown as Post)}
    {cp("WiaiPost-gottesbeweis",    gottesbeweiPost         as unknown as Post)}
    {cp("WiaiPost-ki-bald",         kiBaldPost              as unknown as Post)}
    {cp("WiaiPost-intro-homemade",  introHomemadePost       as unknown as Post)}
    {cp("WiaiPost-intro-alter",     introAlterPost          as unknown as Post)}
    {cp("WiaiPost-bier",            bierPost                as unknown as Post)}
    {cp("WiaiPost-work-life",       workLifePost            as unknown as Post)}
    {cp("WiaiPost-mieten-rauchbier", mietenRauchbierPost    as unknown as Post)}
    {cp("WiaiPost-chatgpt-klausur", chatgptKlausurPost      as unknown as Post)}
    {cp("WiaiPost-bulimie-lernen",  bulimieLernenPost       as unknown as Post)}
    {cp("WiaiPost-taschenrechner",  taschenrechnerPost     as unknown as Post)}
    {cp("WiaiPost-wiai-profs",      wiaiProfsPost          as unknown as Post)}
    {cp("WiaiPost-maennerfach",     maennerfachPost        as unknown as Post)}
    {cp("WiaiPost-tensor-tournament", tensorTournamentPost as unknown as Post)}
    {cp("WiaiPost-ehrliche-apps",   ehrlicheAppsPost       as unknown as Post)}
    {cp("WiaiPost-vorlesung-netflix", vorlesungNetflixPost as unknown as Post)}
    {cp("WiaiPost-merkste-fahrpruefung", merksteFahrpruefungPost as unknown as Post)}
    {cp("WiaiPost-merkste-netflix",      merksteNetflixPost      as unknown as Post)}
    {cp("WiaiPost-programmierik",        programmierikPost        as unknown as Post)}
    {cp("WiaiPost-fake-statistik",       fakeStatistikPost       as unknown as Post)}
    {cp("WiaiPost-ikea",                 ikeaPost                as unknown as Post)}
    {cp("WiaiPost-meta-manipulation",    metaManipulationPost    as unknown as Post)}
    {cp("WiaiPost-silicon-valley",       siliconValleyPost      as unknown as Post)}
    {cp("WiaiPost-binary-search",        binarySearchPost       as unknown as Post)}
    {cp("WiaiPost-informatik-trocken",   informatikTrockenPost  as unknown as Post)}
    {cp("WiaiPost-hackathon-nacht",      hackathonNachtPost     as unknown as Post)}
    {cp("WiaiPost-stopp-handy",          stoppHandyPost         as unknown as Post)}
    {cp("WiaiPost-merkste-schule",       merksteSchulePost      as unknown as Post)}

    {/* ── Design variants: Billboard, Terminal, Pixel Wall ─────────────── */}
    {cp("WiaiPost-test-billboard",       testBillboardPost       as unknown as Post)}
    {cp("WiaiPost-test-terminal-green",  testTerminalGreenPost   as unknown as Post)}
    {cp("WiaiPost-test-terminal-amber",  testTerminalAmberPost   as unknown as Post)}
    {cp("WiaiPost-test-pixel-wall-maze", testPixelWallMazePost   as unknown as Post)}

    {/* ── A/B experiments: timing overrides on existing posts ────────────── */}
    {/* These test different music variants without changing the post JSON.  */}
    {/* Delete once you've picked a winner and baked it into the JSON.       */}
    {cv("WiaiPost-contrarian-through", contrarianoerhaengePost as unknown as Post, { variant: "through" })}
    {cv("WiaiPost-ki-gesagt-ts",       kiGesagtPost   as unknown as Post, { variant: "through-scratch", act1Duration: 225 })}
    {cv("WiaiPost-bambirds-extended",  bambirdsPost   as unknown as Post, { variant: "through-scratch", act1Duration: 225 })}

    {/* Alt Act3 music experiments — bambirds with different closing tracks  */}
    {cv("WiaiPost-bambirds-alt-a", bambirdsPost as unknown as Post, { variant: "through-scratch", act1Duration: 225, act3Track: "a" })}
    {cv("WiaiPost-bambirds-alt-b", bambirdsPost as unknown as Post, { variant: "through-scratch", act1Duration: 225, act3Track: "b" })}
    {cv("WiaiPost-bambirds-alt-c", bambirdsPost as unknown as Post, { variant: "through-scratch", act1Duration: 225, act3Track: "c" })}
    {cv("WiaiPost-bambirds-alt-d", bambirdsPost as unknown as Post, { variant: "through-scratch", act1Duration: 225, act3Track: "d" })}
    {cv("WiaiPost-bambirds-alt-e", bambirdsPost as unknown as Post, { variant: "through-scratch", act1Duration: 225, act3Track: "e" })}
    {cv("WiaiPost-bambirds-alt-f", bambirdsPost as unknown as Post, {
      variant: "through-scratch", act1Duration: 225, act3Track: "f",
      scratchOffset: 0, act3MusicDelay: 18,
    })}
  </>
);
