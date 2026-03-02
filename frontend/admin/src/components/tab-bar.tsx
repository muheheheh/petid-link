"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Dropdown, theme } from "antd";
import { X } from "lucide-react";

interface Tab {
  key: string;
  label: string;
}

const STORAGE_KEY = "admin_tabs";
const R = 8;

const PATH_LABELS: Record<string, string> = {
  "/": "首页",
  "/managers": "账号管理",
  "/manager-sessions": "登录日志",
  "/users": "用户列表",
  "/devices": "设备列表",
  "/pets": "宠物列表",
  "/scan-logs": "扫码记录",
};

function normalizePath(pathname: string): string {
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg ? `/${seg}` : "/";
}

function getLabel(path: string): string {
  return PATH_LABELS[path] || path;
}

function loadTabs(): Tab[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const tabs = JSON.parse(raw) as Tab[];
      if (tabs.length > 0) return tabs;
    }
  } catch {}
  return [];
}

function saveTabs(tabs: Tab[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
}

function tabStyles(bg: string): string {
  return `
    .chrome-tab { position: relative; }
    .chrome-tab::before,
    .chrome-tab::after {
      content: "";
      position: absolute;
      bottom: 0;
      width: ${R}px;
      height: ${R}px;
      pointer-events: none;
    }
    .chrome-tab::before {
      left: -${R}px;
      background: radial-gradient(circle at 0 0, transparent ${R}px, ${bg} ${R}px);
    }
    .chrome-tab::after {
      right: -${R}px;
      background: radial-gradient(circle at 100% 0, transparent ${R}px, ${bg} ${R}px);
    }
    .chrome-tab-no-left::before { display: none; }
  `;
}

interface TabBarProps {
  onFirstTabActive?: (active: boolean) => void;
}

export default function TabBar({ onFirstTabActive }: TabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [tabs, setTabs] = useState<Tab[]>(loadTabs);
  const tabsRef = useRef(tabs);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { token } = theme.useToken();

  const updateTabs = useCallback((newTabs: Tab[]) => {
    tabsRef.current = newTabs;
    setTabs(newTabs);
    saveTabs(newTabs);
  }, []);

  const activeKey = normalizePath(pathname);
  const activeIdx = tabs.findIndex((t) => t.key === activeKey);
  const isFirstActive = activeIdx === 0;

  useEffect(() => {
    onFirstTabActive?.(isFirstActive);
  }, [isFirstActive, onFirstTabActive]);

  useEffect(() => {
    const current = tabsRef.current;
    if (!current.find((t) => t.key === activeKey)) {
      updateTabs([...current, { key: activeKey, label: getLabel(activeKey) }]);
    }
  }, [activeKey, updateTabs]);

  function closeTab(key: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    const current = tabsRef.current;
    const idx = current.findIndex((t) => t.key === key);
    if (idx < 0) return;
    const newTabs = current.filter((t) => t.key !== key);

    if (activeKey === key) {
      if (newTabs.length === 0) {
        updateTabs([{ key: "/", label: getLabel("/") }]);
        router.push("/");
      } else {
        const next = newTabs[Math.min(idx, newTabs.length - 1)];
        updateTabs(newTabs);
        router.push(next.key);
      }
    } else {
      updateTabs(newTabs);
    }
  }

  function closeOthers(key: string) {
    const tab = tabsRef.current.find((t) => t.key === key);
    if (!tab) return;
    updateTabs([tab]);
    router.push(key);
  }

  function closeRight(key: string) {
    const current = tabsRef.current;
    const idx = current.findIndex((t) => t.key === key);
    if (idx < 0) return;
    const newTabs = current.slice(0, idx + 1);
    updateTabs(newTabs);
    if (!newTabs.find((t) => t.key === activeKey)) router.push(key);
  }

  function closeLeft(key: string) {
    const current = tabsRef.current;
    const idx = current.findIndex((t) => t.key === key);
    if (idx < 0) return;
    const newTabs = current.slice(idx);
    updateTabs(newTabs);
    if (!newTabs.find((t) => t.key === activeKey)) router.push(key);
  }

  function closeAll() {
    updateTabs([{ key: "/", label: getLabel("/") }]);
    router.push("/");
  }

  const contextMenuItems = (key: string) => {
    const idx = tabs.findIndex((t) => t.key === key);
    return {
      items: [
        { key: "close", label: "关闭" },
        { key: "closeOthers", label: "关闭其他", disabled: tabs.length <= 1 },
        { key: "closeLeft", label: "关闭左侧", disabled: idx === 0 },
        { key: "closeRight", label: "关闭右侧", disabled: idx >= tabs.length - 1 },
        { type: "divider" as const },
        { key: "closeAll", label: "关闭所有" },
      ],
      onClick: ({ key: action }: { key: string }) => {
        if (action === "close") closeTab(key);
        else if (action === "closeOthers") closeOthers(key);
        else if (action === "closeLeft") closeLeft(key);
        else if (action === "closeRight") closeRight(key);
        else if (action === "closeAll") closeAll();
      },
    };
  };

  if (tabs.length === 0) return null;

  const bg = token.colorBgContainer;
  const isDark = bg !== "#ffffff" && bg !== "#fff";

  return (
    <>
      <style>{tabStyles(bg)}</style>
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          alignItems: "flex-end",
          padding: "6px 24px 0",
          background: token.colorBgLayout,
          overflowX: "auto",
          whiteSpace: "nowrap",
          scrollbarWidth: "none",
        }}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.key === activeKey;
          const isFirst = index === 0;
          const cls = isActive ? `chrome-tab${isFirst ? " chrome-tab-no-left" : ""}` : undefined;
          return (
            <Dropdown key={tab.key} menu={contextMenuItems(tab.key)} trigger={["contextMenu"]}>
              <div
                className={cls}
                onClick={() => router.push(tab.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 16px",
                  fontSize: 13,
                  cursor: "pointer",
                  borderRadius: `${R}px ${R}px 0 0`,
                  background: isActive ? bg : "transparent",
                  color: isActive ? token.colorText : token.colorTextSecondary,
                  fontWeight: isActive ? 500 : 400,
                  userSelect: "none",
                  zIndex: isActive ? 1 : 0,
                }}
              >
                <span>{tab.label}</span>
                <span
                  onClick={(e) => closeTab(tab.key, e)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    marginLeft: 2,
                    opacity: isActive ? 0.7 : 0.4,
                    transition: "opacity 0.2s, background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.opacity = "1";
                    (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.opacity = isActive ? "0.7" : "0.4";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <X size={12} />
                </span>
              </div>
            </Dropdown>
          );
        })}
      </div>
    </>
  );
}
