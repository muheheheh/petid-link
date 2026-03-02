"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { theme, DatePicker } from "antd";
import { Users, PawPrint, Smartphone, ScanLine } from "lucide-react";
import { request } from "@/lib/api";
import { formatTime } from "@/lib/utils";
import { getAdminInfo } from "@/lib/auth";
import dayjs, { type Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

interface Stats {
  user_count: number;
  new_user_count: number;
  pet_count: number;
  new_pet_count: number;
  device_count: number;
  new_device_count: number;
  device_activated_count: number;
  device_bound_count: number;
  lost_pet_count: number;
  scan_count: number;
  recent_scans: { id: string; device_id: string | null; pet_name: string | null; scanned_at: number | null }[];
}

type RangeValue = [Dayjs | null, Dayjs | null] | null;

const presets = [
  { label: "今日", value: [dayjs().startOf("day"), dayjs()] as [Dayjs, Dayjs] },
  { label: "昨日", value: [dayjs().subtract(1, "day").startOf("day"), dayjs().subtract(1, "day").endOf("day")] as [Dayjs, Dayjs] },
  { label: "近7天", value: [dayjs().subtract(6, "day").startOf("day"), dayjs()] as [Dayjs, Dayjs] },
  { label: "近30天", value: [dayjs().subtract(29, "day").startOf("day"), dayjs()] as [Dayjs, Dayjs] },
];

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [range, setRange] = useState<RangeValue>([dayjs().startOf("day"), dayjs()]);
  const { token } = theme.useToken();

  const fetchStats = useCallback(() => {
    const params: Record<string, unknown> = {};
    if (range?.[0]) params.start_time =range[0].valueOf();
    if (range?.[1]) params.end_time = range[1].valueOf();
    request<Stats>("/stats", params).then(setStats).catch(() => {});
  }, [range]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const adminInfo = getAdminInfo();
  const displayName = adminInfo?.nickname || adminInfo?.username || "你";

  function getGreeting(): { title: string; subtitle: string } {
    const h = new Date().getHours();
    if (h < 6) return { title: "夜深了", subtitle: "辛苦了，早点休息吧 🌙" };
    if (h < 9) {
      const subs = ["新的一天，元气满满 ☀️", "今天也要加油鸭 🐣", "美好的一天从现在开始"];
      return { title: "早上好", subtitle: subs[Math.floor(Math.random() * subs.length)] };
    }
    if (h < 12) {
      const subs = ["工作顺利，效率拉满 🚀", "来杯咖啡，继续冲 ☕", "今天的待办清单还好吗？"];
      return { title: "上午好", subtitle: subs[Math.floor(Math.random() * subs.length)] };
    }
    if (h < 14) {
      const subs = ["午饭吃了吗？记得休息一下 🍱", "适当摸鱼，下午更有精神", "中场休息，充充电 🔋"];
      return { title: "中午好", subtitle: subs[Math.floor(Math.random() * subs.length)] };
    }
    if (h < 18) {
      const subs = ["下午茶时间到了 🍵", "保持专注，离下班不远了", "状态不错，继续保持 💪"];
      return { title: "下午好", subtitle: subs[Math.floor(Math.random() * subs.length)] };
    }
    if (h < 22) {
      const subs = ["忙碌了一天，辛苦了 🌆", "今天的工作完成得怎么样？", "放松一下，明天继续 🎵"];
      return { title: "晚上好", subtitle: subs[Math.floor(Math.random() * subs.length)] };
    }
    return { title: "夜深了", subtitle: "辛苦了，早点休息吧 🌙" };
  }

  const cards = [
    { label: "注册用户", total: stats?.user_count, inc: stats?.new_user_count, icon: <Users size={20} />, color: "#1677ff", href: "/users" },
    { label: "宠物总数", total: stats?.pet_count, inc: stats?.new_pet_count, icon: <PawPrint size={20} />, color: "#52c41a", href: "/pets" },
    { label: "设备总数", total: stats?.device_count, inc: stats?.new_device_count, icon: <Smartphone size={20} />, color: "#722ed1", href: "/devices" },
    { label: "扫码次数", total: stats?.scan_count, icon: <ScanLine size={20} />, color: "#fa8c16", href: "/scan-logs" },
  ];

  const cardStyle: React.CSSProperties = {
    flex: "1 1 200px",
    padding: "20px 24px",
    borderRadius: token.borderRadiusLG,
    background: token.colorBgContainer,
    border: `1px solid ${token.colorBorderSecondary}`,
    cursor: "pointer",
    transition: "box-shadow 0.2s",
  };

  const iconBg = (color: string): React.CSSProperties => ({
    width: 40, height: 40, borderRadius: 10,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: `${color}15`, color,
  });

  const greeting = getGreeting();

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🐾</div>
        <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: token.colorText }}>{greeting.title}，{displayName}</h2>
        <p style={{ color: token.colorTextSecondary, marginTop: 6, fontSize: 14 }}>{greeting.subtitle}</p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <RangePicker
          value={range}
          onChange={(v) => setRange(v)}
          presets={presets}
          allowClear={false}
        />
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
        {cards.map((c) => (
          <div key={c.label} style={cardStyle} onClick={() => router.push(c.href)}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 12px ${c.color}20`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={iconBg(c.color)}>{c.icon}</div>
              <div>
                <div style={{ fontSize: 12, color: token.colorTextSecondary }}>{c.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: token.colorText, lineHeight: 1.2 }}>{c.total ?? "-"}</span>
                  {"inc" in c && typeof c.inc === "number" && c.inc > 0 && (
                    <span style={{ fontSize: 13, color: c.color, fontWeight: 500 }}>+{c.inc}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 300px", padding: 24, borderRadius: token.borderRadiusLG, background: token.colorBgContainer, border: `1px solid ${token.colorBorderSecondary}` }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: token.colorText }}>数据概览</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "已激活设备", value: stats?.device_activated_count ?? "-", total: stats?.device_count },
              { label: "已绑定设备", value: stats?.device_bound_count ?? "-", total: stats?.device_count },
              { label: "走丢宠物", value: stats?.lost_pet_count ?? "-", total: stats?.pet_count },
            ].map((item) => {
              const pct = typeof item.value === "number" && typeof item.total === "number" && item.total > 0
                ? Math.round((item.value / item.total) * 100) : 0;
              return (
                <div key={item.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: token.colorTextSecondary }}>{item.label}</span>
                    <span style={{ color: token.colorText, fontWeight: 500 }}>{item.value}{typeof item.total === "number" ? ` / ${item.total}` : ""}</span>
                  </div>
              <div style={{ height: 6, borderRadius: 3, background: token.colorFillSecondary }}>
                    <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: item.label === "走丢宠物" ? "#ff4d4f" : "#1677ff", transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ flex: "1 1 300px", padding: 24, borderRadius: token.borderRadiusLG, background: token.colorBgContainer, border: `1px solid ${token.colorBorderSecondary}` }}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: token.colorText }}>最近扫码</div>
          {stats?.recent_scans?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {stats.recent_scans.map((s) => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                  <span style={{ color: token.colorText }}>{s.pet_name || s.device_id?.slice(0, 8) || "未知设备"}</span>
                  <span style={{ color: token.colorTextSecondary, fontSize: 12 }}>{formatTime(s.scanned_at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: token.colorTextSecondary, fontSize: 13, textAlign: "center", padding: "24px 0" }}>暂无扫码记录</div>
          )}
        </div>
      </div>
    </div>
  );
}
