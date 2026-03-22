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
    text: string;      // S3 punchline/closing beat
    button?: string;   // optional dimmed follow-up (comedian's tag)
    url?: string;      // optional, not displayed by default
  };
}
