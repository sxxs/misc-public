import { useState } from "react";

const POSTS = [
  {
    id: 1,
    // Slide 1: The news screenshot + dry reaction
    screenshotHeadline: "23andMe meldet Insolvenz:\nDNA-Daten von 15 Mio.\nNutzern stehen zum Verkauf",
    screenshotSource: "SPIEGEL.DE",
    reaction: "Ach.",
    // Slide 2: The WIAI punchline — laconic, dry
    punchline: "Bei uns lernst du,\nwarum sowas passiert.\nUnd warum es weiter\npassieren wird.",
    // Slide 3: CTA
    cta: "studium.wiai.uni-bamberg.de",
    ctaSub: "IT-Sicherheit & Datenschutz studieren.\nIn Bamberg. Nicht im Silicon Valley.",
    accentColor: "#FF2D2D",
  },
  {
    id: 2,
    screenshotHeadline: "Studie: 73% der Studierenden\nlernen erst in der letzten\nWoche vor der Klausur",
    screenshotSource: "ZEIT CAMPUS",
    reaction: "Überraschend\nist das nicht.",
    punchline: "Wir haben ein System\nerfunden, das Bulimie-\nLernen überflüssig macht.\n80% machen freiwillig mit.\nDie anderen 20% bereuen es.",
    cta: "psi.uni-bamberg.de/lehre/booklet",
    ctaSub: "Das Booklet-System.\nKein Trick. Funktioniert trotzdem.",
    accentColor: "#FFE500",
  },
  {
    id: 3,
    screenshotHeadline: "Durchschnittliche Miete für\nWG-Zimmer in München\nerstmals über 780 Euro",
    screenshotSource: "SÜDDEUTSCHE.DE",
    reaction: "Tja.",
    punchline: "Bamberg: 390 €.\nUNESCO-Welterbe.\n12 Brauereien.\nInformatik genauso gut.\nBier besser.",
    cta: "studium.wiai.uni-bamberg.de/einblicke",
    ctaSub: "Informatik studieren, wo man sich\ndie Miete leisten kann.",
    accentColor: "#FF9900",
  },
  {
    id: 4,
    screenshotHeadline: "Hochschulen streiten über\nChatGPT-Verbot in Klausuren",
    screenshotSource: "FORSCHUNG & LEHRE",
    reaction: "Falsche\nDiskussion.",
    punchline: "Vielleicht ist nicht ChatGPT\ndas Problem, sondern\nKlausuren auf Papier.\nBei uns programmierst du\nin VS Code. In der Klausur.\nAuf echten Laptops.",
    cta: "psi.uni-bamberg.de/lehre/psi-exam",
    ctaSub: "380 Laptops. 600+ Prüfungen/Jahr.\nKeine Angst vor der Zukunft.",
    accentColor: "#FFE500",
  },
  {
    id: 5,
    screenshotHeadline: "Google entlässt erneut\nHunderte Mitarbeiter —\nauch in der KI-Forschung",
    screenshotSource: "HANDELSBLATT",
    reaction: "Oh nein.\nAnyway.",
    punchline: "109.000 offene IT-Stellen\nin Deutschland.\nArbeitslosenquote: 3,7%.\nUnsere Absolvent:innen\nhaben den Vertrag vor\ndem Abschluss.",
    cta: "studium.wiai.uni-bamberg.de/einblicke",
    ctaSub: "Karriere-Panik ist woanders.\nHier ist Bamberg.",
    accentColor: "#66FF66",
  },
];

// Halftone dot pattern as SVG data URI
function halftonePattern(dotColor = "white", opacity = 0.06, size = 8) {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size/2}" cy="${size/2}" r="${size * 0.22}" fill="${dotColor}" opacity="${opacity}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// Simulated news screenshot with halftone treatment
function NewsScreenshot({ headline, source, accent }) {
  return (
    <div
      style={{
        position: "relative",
        margin: "0 20px",
        background: "#1a1a1a",
        borderRadius: 4,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Halftone overlay on the screenshot */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: halftonePattern("white", 0.12, 6),
          backgroundSize: "6px 6px",
          zIndex: 2,
          pointerEvents: "none",
          mixBlendMode: "overlay",
        }}
      />
      {/* Scan line effect */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />
      {/* "Screenshot" content */}
      <div style={{ padding: "16px 18px 14px", position: "relative", zIndex: 1 }}>
        <div
          style={{
            color: "rgba(255,255,255,0.3)",
            fontSize: 9,
            fontFamily: "'Space Mono', monospace",
            letterSpacing: "0.15em",
            marginBottom: 10,
            textTransform: "uppercase",
          }}
        >
          ■ {source}
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1.3,
            fontFamily: "'Space Grotesk', sans-serif",
            whiteSpace: "pre-line",
          }}
        >
          {headline}
        </div>
      </div>
      {/* Colored bar at bottom */}
      <div style={{ height: 3, background: accent }} />
    </div>
  );
}

// Slide frame with halftone background
function SlideFrame({ children, accent, slideNum }) {
  return (
    <div
      style={{
        width: 360,
        height: 640,
        background: "#0A0A0A",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderRadius: 8,
        boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
      }}
    >
      {/* Halftone dot background — varied density */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: halftonePattern("white", 0.04, 10),
          backgroundSize: "10px 10px",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      {/* Larger halftone in corners for depth */}
      <div
        style={{
          position: "absolute",
          bottom: -100,
          right: -100,
          width: 350,
          height: 350,
          backgroundImage: `radial-gradient(circle, ${accent}08 1px, transparent 1px)`,
          backgroundSize: "14px 14px",
          zIndex: 0,
          pointerEvents: "none",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -80,
          left: -80,
          width: 250,
          height: 250,
          backgroundImage: `radial-gradient(circle, ${accent}05 1px, transparent 1px)`,
          backgroundSize: "8px 8px",
          zIndex: 0,
          pointerEvents: "none",
          borderRadius: "50%",
        }}
      />

      {/* Content */}
      <div style={{ flex: 1, position: "relative", zIndex: 5, display: "flex", flexDirection: "column" }}>
        {children}
      </div>

      {/* Bottom bar */}
      <div style={{ padding: "0 20px 16px", position: "relative", zIndex: 5 }}>
        <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                width: n === slideNum ? 24 : 8,
                height: 3,
                borderRadius: 2,
                background: n === slideNum ? accent : "rgba(255,255,255,0.12)",
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span
              style={{
                color: "#FFE500",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.2em",
                fontFamily: "'Space Mono', monospace",
              }}
            >
              WIAI
            </span>
            <span
              style={{
                color: "rgba(255,255,255,0.2)",
                fontSize: 8,
                letterSpacing: "0.08em",
                fontFamily: "'Space Mono', monospace",
              }}
            >
              UNI BAMBERG
            </span>
          </div>
          <span
            style={{
              color: "rgba(255,255,255,0.15)",
              fontSize: 9,
              fontFamily: "'Space Mono', monospace",
            }}
          >
            @herdom
          </span>
        </div>
      </div>
    </div>
  );
}

// SLIDE 1: News screenshot + laconic one-word reaction
function Slide1({ post }) {
  const accent = post.accentColor;
  return (
    <SlideFrame accent={accent} slideNum={1}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 28,
        }}
      >
        {/* News screenshot */}
        <NewsScreenshot
          headline={post.screenshotHeadline}
          source={post.screenshotSource}
          accent={accent}
        />

        {/* Laconic reaction — BIG, centered */}
        <div
          style={{
            padding: "0 28px",
            position: "relative",
          }}
        >
          {/* Glitch layers */}
          <div
            style={{
              position: "absolute",
              left: 25,
              top: 3,
              color: "#FF2D2D",
              opacity: 0.35,
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 0.95,
              fontFamily: "'Space Grotesk', sans-serif",
              whiteSpace: "pre-line",
              clipPath: "inset(20% 0 40% 0)",
            }}
          >
            {post.reaction}
          </div>
          <div
            style={{
              position: "absolute",
              left: 31,
              top: -2,
              color: "#00E5FF",
              opacity: 0.3,
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 0.95,
              fontFamily: "'Space Grotesk', sans-serif",
              whiteSpace: "pre-line",
              clipPath: "inset(50% 0 10% 0)",
            }}
          >
            {post.reaction}
          </div>
          <div
            style={{
              position: "relative",
              color: "#fff",
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 0.95,
              fontFamily: "'Space Grotesk', sans-serif",
              whiteSpace: "pre-line",
            }}
          >
            {post.reaction}
          </div>
        </div>
      </div>
    </SlideFrame>
  );
}

// SLIDE 2: The punchline on white cutout with accent shadow
function Slide2({ post }) {
  const accent = post.accentColor;
  return (
    <SlideFrame accent={accent} slideNum={2}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 20px",
        }}
      >
        <div style={{ position: "relative" }}>
          {/* Accent color offset shadow */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: accent,
              transform: "translate(7px, 7px) rotate(0.6deg)",
              clipPath:
                "polygon(1% 2%, 98.5% 0%, 100% 3.5%, 98% 96.5%, 99.5% 99%, 2.5% 100%, 0% 97%, 0.5% 3%)",
            }}
          />
          {/* White cutout */}
          <div
            style={{
              position: "relative",
              background: "#F0EDE8",
              padding: "32px 26px",
              clipPath:
                "polygon(0.5% 1%, 98% 0%, 99.5% 2%, 99% 97.5%, 97.5% 99.5%, 1.5% 99%, 0% 97%, 0.5% 2.5%)",
            }}
          >
            <div
              style={{
                color: "#0A0A0A",
                fontSize: 26,
                fontWeight: 700,
                lineHeight: 1.18,
                letterSpacing: "-0.01em",
                fontFamily: "'Space Grotesk', sans-serif",
                whiteSpace: "pre-line",
              }}
            >
              {post.punchline}
            </div>
          </div>
        </div>
      </div>
    </SlideFrame>
  );
}

// SLIDE 3: CTA — bold, clean
function Slide3({ post }) {
  const accent = post.accentColor;
  return (
    <SlideFrame accent={accent} slideNum={3}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 28px",
          gap: 28,
        }}
      >
        {/* "Mehr dazu" with big arrow */}
        <div>
          <div
            style={{
              color: accent,
              fontSize: 14,
              fontFamily: "'Space Mono', monospace",
              fontWeight: 700,
              letterSpacing: "0.15em",
              marginBottom: 6,
              textTransform: "uppercase",
            }}
          >
            LINK IN BIO
          </div>
          <div
            style={{
              width: 48,
              height: 4,
              background: accent,
            }}
          />
        </div>

        {/* URL — prominent */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `2px solid ${accent}`,
            borderRadius: 0,
            padding: "18px 20px",
          }}
        >
          <div
            style={{
              color: "#fff",
              fontSize: 15,
              fontFamily: "'Space Mono', monospace",
              fontWeight: 700,
              wordBreak: "break-all",
              lineHeight: 1.4,
            }}
          >
            {post.cta}
          </div>
        </div>

        {/* What you'll find */}
        <div
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: 13,
            lineHeight: 1.55,
            fontFamily: "'Space Mono', monospace",
            whiteSpace: "pre-line",
          }}
        >
          {post.ctaSub}
        </div>
      </div>
    </SlideFrame>
  );
}

export default function WIAIFinalTemplates() {
  const [activePost, setActivePost] = useState(0);
  const post = POSTS[activePost];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "white",
        fontFamily: "'Space Mono', 'Courier New', monospace",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Space+Grotesk:wght@400;700&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div style={{ padding: "28px 28px 12px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
          <span style={{ color: "#FFE500", fontSize: 22, fontWeight: 700, letterSpacing: "0.2em" }}>
            WIAI
          </span>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, letterSpacing: "0.1em" }}>
            NEWSJACKING TEMPLATES
          </span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0, maxWidth: 550, lineHeight: 1.5 }}>
          Slide 1: Screenshot der Nachricht + lakonische Reaktion. Slide 2: WIAI-Punchline. Slide 3: CTA.
        </p>
      </div>

      {/* Post selector tabs */}
      <div style={{ padding: "6px 28px 16px", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {POSTS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setActivePost(i)}
            style={{
              background: i === activePost ? p.accentColor : "rgba(255,255,255,0.04)",
              color: i === activePost ? "#0A0A0A" : "rgba(255,255,255,0.35)",
              border: i === activePost ? "none" : "1px solid rgba(255,255,255,0.08)",
              padding: "5px 12px",
              fontSize: 10,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              letterSpacing: "0.06em",
              cursor: "pointer",
              borderRadius: 2,
              transition: "all 0.15s",
            }}
          >
            {p.screenshotSource}
          </button>
        ))}
      </div>

      {/* 3-slide carousel */}
      <div style={{ padding: "0 28px" }}>
        <div
          style={{
            display: "flex",
            gap: 14,
            overflowX: "auto",
            paddingBottom: 24,
            scrollSnapType: "x mandatory",
          }}
        >
          <div style={{ scrollSnapAlign: "start" }}><Slide1 post={post} /></div>
          <div style={{ scrollSnapAlign: "start" }}><Slide2 post={post} /></div>
          <div style={{ scrollSnapAlign: "start" }}><Slide3 post={post} /></div>
        </div>
      </div>

      {/* Video timing compact */}
      <div style={{ padding: "16px 28px 40px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, letterSpacing: "0.15em", marginBottom: 12 }}>
          ALS 15-SEK-VIDEO
        </div>
        <div style={{ display: "flex", height: 36, borderRadius: 3, overflow: "hidden", maxWidth: 500 }}>
          <div
            style={{
              flex: 4,
              background: "rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              borderRight: `2px solid ${post.accentColor}`,
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, fontFamily: "'Space Mono', monospace" }}>0–4s</span>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 8, fontFamily: "'Space Mono', monospace" }}>Screenshot + Reaktion</span>
          </div>
          <div
            style={{
              flex: 7,
              background: `${post.accentColor}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              borderRight: `2px solid ${post.accentColor}`,
            }}
          >
            <span style={{ color: post.accentColor, fontSize: 9, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>4–11s</span>
            <span style={{ color: `${post.accentColor}99`, fontSize: 8, fontFamily: "'Space Mono', monospace" }}>Punchline baut sich auf</span>
          </div>
          <div
            style={{
              flex: 4,
              background: "rgba(255,255,255,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontFamily: "'Space Mono', monospace" }}>11–15s</span>
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 8, fontFamily: "'Space Mono', monospace" }}>Link in Bio</span>
          </div>
        </div>
      </div>
    </div>
  );
}
