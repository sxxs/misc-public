import React from "react";
import { Composition } from "remotion";
import { WiaiPost } from "./compositions/WiaiPost";
import { Post } from "./types";

const kiPost: Post = {
  id: "2026-03-21-ki-jobs",
  type: "newsjacking",
  category: "KI",
  accentColor: "#FACC15",
  slide1: {
    image: "./assets/screenshots/some-news-on-ki.png",
    bigText: "Tja.",
    smallText: "Alle paar Monate erklärt jemand die Informatik für tot.",
  },
  slide2: {
    text: "Panik ist das\nGeschäftsmodell\nmancher Leute.\n\nFür uns ist das\nein Studienfach.",
  },
  slide3: {
    url: "studium.wiai.uni-bamberg.de",
    subtext: "Wer KI versteht,\nbaut sie.\n\nInformatik · Bamberg · kein NC",
  },
};

const nachtgedankePost: Post = {
  id: "test-nachtgedanke",
  type: "nachtgedanke",
  slide1: { time: "23:47", bigText: "" },
  slide2: {
    text: "Du musst nicht wissen\nwas du mit deinem Leben\nmachen willst.\n\nDu musst nur wissen\nwas du nächstes Semester\nausprobieren willst.\n\nDer Rest ergibt sich.\nOder auch nicht.\nBeides ist okay.",
  },
  slide3: {
    url: "studium.wiai.uni-bamberg.de",
    subtext: "Alle Bachelorstudiengänge sind zulassungsfrei.",
  },
};

const witzPost: Post = {
  id: "test-witz",
  type: "witz",
  slide1: { bigText: "WER IST CLEVER\nUND SITZT NICHT\nIM HÖRSAAL?" },
  slide2: {
    text: "Tim.\n\nTim studiert an der WIAI.\nDa geht das oft auch\nvon zu Hause aus.",
  },
  slide3: {
    url: "studium.wiai.uni-bamberg.de",
    subtext: "Flexibel studieren. Wie Tim.",
  },
};

export const Root: React.FC = () => (
  <>
    <Composition
      id="WiaiPost"
      component={WiaiPost as unknown as React.ComponentType<Record<string, unknown>>}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={kiPost}
    />
    <Composition
      id="WiaiPost-nachtgedanke"
      component={WiaiPost as unknown as React.ComponentType<Record<string, unknown>>}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={nachtgedankePost}
    />
    <Composition
      id="WiaiPost-witz"
      component={WiaiPost as unknown as React.ComponentType<Record<string, unknown>>}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={witzPost}
    />
  </>
);
