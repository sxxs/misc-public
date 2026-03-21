import React from "react";
import { Post } from "../types";
import { Newsjacking } from "./Newsjacking";
import { Nachtgedanke } from "./Nachtgedanke";
import { WusstestDu } from "./WusstestDu";
import { Contrarian } from "./Contrarian";
import { Selbstironie } from "./Selbstironie";
import { Witz } from "./Witz";

export const WiaiPost: React.FC<Post> = (post) => {
  switch (post.type) {
    case "newsjacking":
      return <Newsjacking post={post} />;
    case "nachtgedanke":
      return <Nachtgedanke post={post} />;
    case "wusstest-du":
      return <WusstestDu post={post} />;
    case "contrarian":
      return <Contrarian post={post} />;
    case "selbstironie":
      return <Selbstironie post={post} />;
    case "witz":
      return <Witz post={post} />;
    default: {
      const _exhaustive: never = post.type;
      return null;
    }
  }
};
