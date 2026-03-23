import React from "react";
import { Composition } from "remotion";
import { WiaiPost } from "./compositions/WiaiPost";
import { Post, ContrarianTiming } from "./types";
import { computeAct2Duration, ACT3_ALT_TRACKS } from "./utils/timing";

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

const TRACK_DURATION = 520; // track.mp3 ~17.3s at 30fps

const contrarianDuration = (post: Post) => {
  const act1Duration = post.timing?.act1Duration ?? 150;
  if (post.timing?.variant === "through") return TRACK_DURATION;
  const altTrack = post.timing?.act3Track ? ACT3_ALT_TRACKS[post.timing.act3Track] : null;
  const delay = post.timing?.act3MusicDelay ?? 0;
  const act3 = altTrack ? altTrack.dur + delay : 295;
  return act1Duration + computeAct2Duration(post.slide2.text) + act3;
};

// Helpers — keep composition declarations concise
const C = WiaiPost as unknown as React.ComponentType<Record<string, unknown>>;
const base = { fps: 30, width: 1080, height: 1920 };

// Post with timing embedded in its JSON (or no timing override needed)
const cp = (id: string, post: Post) => (
  <Composition key={id} id={id} component={C}
    durationInFrames={contrarianDuration(post)} {...base}
    defaultProps={post as unknown as Record<string, unknown>} />
);

// Post with a timing override (keeps original JSON unchanged)
const cv = (id: string, post: Post, timing: ContrarianTiming) => {
  const p: Post = { ...post, timing };
  return (
    <Composition key={id} id={id} component={C}
      durationInFrames={contrarianDuration(p)} {...base}
      defaultProps={p as unknown as Record<string, unknown>} />
  );
};

export const Root: React.FC = () => (
  <>
    {/* ── Non-contrarian compositions (fixed duration) ────────────────────── */}
    <Composition id="WiaiPost" component={C} durationInFrames={450} {...base}
      defaultProps={kiJobsPost as unknown as Post} />
    <Composition id="WiaiPost-nachtgedanke" component={C} durationInFrames={450} {...base}
      defaultProps={nachtgedankePost as unknown as Post} />
    <Composition id="WiaiPost-witz" component={C} durationInFrames={450} {...base}
      defaultProps={witzPost as unknown as Post} />

    {/* ── Contrarian: originals (default scratch variant, act1=150) ────────── */}
    {cp("WiaiPost-contrarian",  contrarianoerhaengePost as unknown as Post)}
    {cp("WiaiPost-mathe3",      mathe3Post              as unknown as Post)}
    {cp("WiaiPost-ki-gesagt",   kiGesagtPost            as unknown as Post)}
    {cp("WiaiPost-passt-nicht", passtNichtPost          as unknown as Post)}
    {cp("WiaiPost-bambirds",    bambirdsPost            as unknown as Post)}
    {cp("WiaiPost-ki-fails",    kiFailsPost             as unknown as Post)}

    {/* ── Contrarian: variant upgrades ────────────────────────────────────── */}
    {/* through: music plays straight — best for short Act2 texts */}
    {cv("WiaiPost-contrarian-through", contrarianoerhaengePost as unknown as Post, { variant: "through", subtextStartFrame: 50, absenderStartFrame: 120 })}
    {cv("WiaiPost-mathe3-through",     mathe3Post              as unknown as Post, { variant: "through", subtextStartFrame: 50, absenderStartFrame: 120 })}
    {cv("WiaiPost-ki-fails-through",   kiFailsPost             as unknown as Post, { variant: "through", subtextStartFrame: 50, absenderStartFrame: 120 })}
    {/* through-scratch: full-volume Act1+Act2, scratch at end, beat-sync Act3 */}
    {/* act1=225 for posts with a longer/heavier S1 quote that needs breathing room */}
    {cv("WiaiPost-ki-gesagt-ts",      kiGesagtPost   as unknown as Post, { variant: "through-scratch", act1Duration: 225 })}
    {cv("WiaiPost-passt-nicht-ts",    passtNichtPost as unknown as Post, { variant: "through-scratch" })}
    {cv("WiaiPost-bambirds-extended", bambirdsPost   as unknown as Post, { variant: "through-scratch", act1Duration: 225 })}

    {/* ── New posts from ideenpool (timing embedded in their JSON) ────────── */}
    {/* handfest  : through-scratch — long Act2, orange */}
    {/* akinator  : through         — educational hook, green */}
    {/* gottesbeweis: through-scratch + act1=225 — 3-line quote needs room, purple */}
    {/* ki-bald   : through-scratch — KI series, yellow */}
    {/* ── Alt Act3 track experiments (through-scratch, act1=225, drum-roll ending) ── */}
    {cv("WiaiPost-bambirds-alt-a", bambirdsPost as unknown as Post, { variant: "through-scratch", act1Duration: 225, act3Track: "a" })}
    {cv("WiaiPost-bambirds-alt-b", bambirdsPost as unknown as Post, { variant: "through-scratch", act1Duration: 225, act3Track: "b" })}
    {cv("WiaiPost-bambirds-alt-c", bambirdsPost as unknown as Post, { variant: "through-scratch", act1Duration: 225, act3Track: "c" })}
    {cv("WiaiPost-bambirds-alt-d", bambirdsPost as unknown as Post, { variant: "through-scratch", act1Duration: 225, act3Track: "d" })}
    {cv("WiaiPost-bambirds-alt-e", bambirdsPost as unknown as Post, { variant: "through-scratch", act1Duration: 225, act3Track: "e" })}
    {/* f: short Act3 (~8.5s), scratch at act3Start, music delayed 18f, later subtext/absender */}
    {cv("WiaiPost-bambirds-alt-f", bambirdsPost as unknown as Post, {
      variant: "through-scratch", act1Duration: 225, act3Track: "f",
      scratchOffset: 0, act3MusicDelay: 18, subtextStartFrame: 110, absenderStartFrame: 185,
    })}

    {cp("WiaiPost-handfest",     handfestPost    as unknown as Post)}
    {cp("WiaiPost-akinator",     akinatorPost    as unknown as Post)}
    {cp("WiaiPost-gottesbeweis", gottesbeweiPost as unknown as Post)}
    {cp("WiaiPost-ki-bald",      kiBaldPost      as unknown as Post)}

    {/* ── Intros ──────────────────────────────────────────────────────────── */}
    {cp("WiaiPost-intro-homemade",  introHomemadePost   as unknown as Post)}
    {cp("WiaiPost-intro-alter",     introAlterPost      as unknown as Post)}
    {cp("WiaiPost-bier",            bierPost            as unknown as Post)}

    {/* ── Rauchbier / Bamberg life ────────────────────────────────────────── */}
    {cp("WiaiPost-work-life",       workLifePost        as unknown as Post)}
    {cp("WiaiPost-mieten-rauchbier", mietenRauchbierPost as unknown as Post)}

    {/* ── Lehre ───────────────────────────────────────────────────────────── */}
    {cp("WiaiPost-chatgpt-klausur", chatgptKlausurPost  as unknown as Post)}
    {cp("WiaiPost-bulimie-lernen",  bulimieLernenPost   as unknown as Post)}
  </>
);
