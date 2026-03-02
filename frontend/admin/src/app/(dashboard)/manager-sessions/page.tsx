"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { request, type PaginatedData } from "@/lib/api";
import { formatTime, formatSessionStatus, sessionStatusColor } from "@/lib/utils";
import { Table, Select, Button, Tag, Tooltip, App } from "antd";
import { getRoleLabel } from "@/lib/permission";
import { getSessionId, logout } from "@/lib/auth";
import type { ColumnsType } from "antd/es/table";

interface Admin { id: string; username: string; nickname: string | null; }
interface Session {
  id: string;
  admin_name: string | null;
  admin_role: string | null;
  device_type: string | null;
  device: string | null;
  os: string | null;
  os_version: string | null;
  ip: string | null;
  user_agent: string | null;
  status: string | null;
  last_active_at: number | null;
  created_at: number | null;
}

export default function ManagerSessionsPage() {
  const searchParams = useSearchParams();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const { message, modal } = App.useApp();
  const [selectedAdmin, setSelectedAdmin] = useState<string | undefined>(searchParams.get("admin_id") || undefined);
  const [sessions, setSessions] = useState<PaginatedData<Session> | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    request<PaginatedData<Admin>>("/manager/list", { page: 1, page_size: 100 }).then((data) => {
      setAdmins(data.list);
    });
  }, []);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = { page, page_size: pageSize };
      if (selectedAdmin) body.admin_id = selectedAdmin;
      const data = await request<PaginatedData<Session>>("/manager/session-list", body);
      setSessions(data);
    } finally {
      setLoading(false);
    }
  }, [selectedAdmin, page, pageSize]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  async function kickSession(sessionId: string) {
    try {
      await request("/manager/kick-session", { session_id: sessionId });
      message.success("已踢出");
      fetchSessions();
    } catch (err: any) {
      message.error(err.message);
    }
  }

  const currentSessionId = getSessionId();

  const columns: ColumnsType<Session> = [
    { title: "账号", dataIndex: "admin_name", render: (v) => v || "-" },
    { title: "角色", dataIndex: "admin_role", render: (v) => v ? <Tag>{getRoleLabel(v)}</Tag> : "-" },
    { title: "浏览器", dataIndex: "device", render: (v, r) => {
      const text = v || "-";
      return r.user_agent ? <Tooltip title={r.user_agent}><span style={{ cursor: "help", borderBottom: "1px dashed #999" }}>{text}</span></Tooltip> : text;
    }},
    { title: "系统", dataIndex: "os", render: (v, r: any) => [v, r.os_version].filter(Boolean).join(" ") || "-" },
    { title: "IP", dataIndex: "ip", render: (v) => v || "-" },
    { title: "状态", dataIndex: "status", render: (v, r) => {
      const isCurrent = r.id === currentSessionId;
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Tag color={sessionStatusColor(v)}>{formatSessionStatus(v)}</Tag>
          {isCurrent && v === "active" && <Tag color="blue">当前</Tag>}
        </span>
      );
    }},
    { title: "最后活跃", dataIndex: "last_active_at", render: (v) => formatTime(v) },
    { title: "登录时间", dataIndex: "created_at", render: (v) => formatTime(v) },
    {
      title: "操作", render: (_, record) => {
        if (record.status !== "active") return "-";
        const isCurrent = record.id === currentSessionId;
        return isCurrent
          ? <Button size="small" onClick={() => modal.confirm({ title: "确认登出", content: "登出后需要重新登录，确定继续？", okText: "确定", cancelText: "取消", onOk: logout })}>登出</Button>
          : <Button size="small" danger onClick={() => modal.confirm({ title: "确认踢出", content: "踢出后该会话将立即失效，确定继续？", okText: "确定", cancelText: "取消", okButtonProps: { danger: true }, onOk: () => kickSession(record.id) })}>踢出</Button>;
      },
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>账号</div>
          <Select
            style={{ width: 200 }}
            value={selectedAdmin}
            onChange={(v) => { setSelectedAdmin(v); setPage(1); }}
            allowClear
            placeholder="全部账号"
            options={admins.map((a) => ({ value: a.id, label: a.nickname || a.username }))}
          />
        </div>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={sessions?.list}
        loading={loading}
        pagination={{
          current: sessions?.page,
          pageSize: sessions?.page_size,
          total: sessions?.total,
          showTotal: (total) => `共 ${total} 条`,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />
    </div>
  );
}
