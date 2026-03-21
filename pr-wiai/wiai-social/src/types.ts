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
    url: string;
    subtext?: string;
  };
}
