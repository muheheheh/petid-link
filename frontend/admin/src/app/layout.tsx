import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ThemeProvider } from "@/lib/theme";
import ThemeConfigProvider from "@/components/theme-config-provider";
import DynamicFavicon from "@/components/dynamic-favicon";
import "./globals.css";

export const metadata: Metadata = {
  title: "寻宠 · 运营平台",
  description: "寻宠运营管理平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hans" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AntdRegistry>
          <ThemeProvider>
            <ThemeConfigProvider>
              <DynamicFavicon />
              {children}
            </ThemeConfigProvider>
          </ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
