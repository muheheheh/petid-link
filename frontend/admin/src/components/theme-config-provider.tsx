"use client";

import { useEffect } from "react";
import { ConfigProvider, App, theme } from "antd";
import { useThemeMode } from "@/lib/theme";
import type { ReactNode } from "react";

const BRAND_COLOR = "#1677ff";

export default function ThemeConfigProvider({ children }: { children: ReactNode }) {
  const { mode } = useThemeMode();

  useEffect(() => {
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  return (
    <ConfigProvider
      theme={{
        cssVar: true,
        algorithm: mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: BRAND_COLOR,
        },
        components: {
          Menu: mode === "light" ? {
            itemSelectedBg: "#e6f4ff",
            itemSelectedColor: BRAND_COLOR,
          } : {},
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
