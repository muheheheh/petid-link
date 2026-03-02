"use client";

import { useEffect } from "react";

const EMOJIS = ["🐶", "🐱"];

function emojiToFavicon(emoji: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.font = "56px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, 32, 36);
  return canvas.toDataURL("image/png");
}

function setFavicon(url: string) {
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
}

export default function DynamicFavicon() {
  useEffect(() => {
    let index = 0;
    setFavicon(emojiToFavicon(EMOJIS[0]));

    const interval = setInterval(() => {
      index = (index + 1) % EMOJIS.length;
      setFavicon(emojiToFavicon(EMOJIS[index]));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
