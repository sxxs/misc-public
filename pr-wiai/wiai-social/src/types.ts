export type PostType =
  | "newsjacking"
  | "nachtgedanke"
  | "wusstest-du"
  | "contrarian"
  | "selbstironie"
  | "witz";

export interface Post {
  id: string;
  type: PostType;
  category?: string;
  accentColor?: string;
  isAd?: boolean;        // opt-in: shows absender/footer on S3 (default: hidden)
  slide1: {
    image?: string;
    time?: string;
    label?: string;
    bigText: string;
    smallText?: string;
  };
  slide2: {
    text: string;
  };
  slide3: {
    text: string;          // S3 punchline/closing beat
    button?: string;       // optional: comedian's follow-up tag (no label, inline)
    übrigensText?: string; // optional: aside with "ÜBRIGENS…" label — alternative to button
    url?: string;          // optional: small CTA URL below button/übrigensText
  };
}
