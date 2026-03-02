"use client";

import { useState, useCallback } from "react";
import { App } from "antd";

interface CopyableTextProps {
  text: string;
  display?: string;
  copyMessage?: string;
}

export default function CopyableText({ text, display, copyMessage }: CopyableTextProps) {
  const [copied, setCopied] = useState(false);
  const { message } = App.useApp();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    message.success(copyMessage || "已复制");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text, message]);

  return (
    <span
      onClick={handleCopy}
      style={{
        fontFamily: "monospace",
        cursor: "pointer",
        userSelect: "none",
        padding: "2px 6px",
        borderRadius: 4,
        transition: "all 0.2s ease",
        background: copied ? "#f6ffed" : "transparent",
        color: copied ? "#52c41a" : undefined,
      }}
    >
      {display ?? text}
    </span>
  );
}
