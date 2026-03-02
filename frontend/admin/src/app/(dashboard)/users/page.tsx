"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { request, type PaginatedData } from "@/lib/api";
import { formatTime, formatSessionStatus, sessionStatusColor } from "@/lib/utils";
import { Table, Button, Input, Drawer, Tabs, Descriptions, Tag, App } from "antd";
import { Eye } from "lucide-react";
import { getAdminInfo } from "@/lib/auth";
import { hasPermission } from "@/lib/permission";
import CopyableText from "@/components/copyable-text";
import type { ColumnsType } from "antd/es/table";

interface User {
  id: string;
  nickname: string | null;
  phone: string | null;
  email: string | null;
  auth_providers: string[];
  created_at: number | null;
}

interface UserDetail extends User {
  avatar: string | null;
}

const AUTH_PROVIDER_LABELS: Record<string, string> = {
  wechat_miniprogram: "微信小程序",
  wechat_app: "微信 App",
  wechat_open: "微信开放平台",
  wechat_mp: "微信公众号",
  google: "Google",
};

interface Session {
  id: string;
  app: string | null;
  device_type: string | null;
  device: string | null;
  os: string | null;
  os_version: string | null;
  ip: string | null;
  status: string | null;
  last_active_at: number | null;
  created_at: number | null;
}

interface DeviceItem {
  id: string;
  activation_code: string;
  pet_id: string | null;
  activated_at: number | null;
  bound_at: number | null;
  created_at: number | null;
}

interface PetItem {
  id: string;
  name: string;
  breed: string | null;
  status: string | null;
  device_id: string | null;
  created_at: number | null;
}

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterUserId = searchParams.get("user_id") || undefined;
  const [data, setData] = useState<PaginatedData<User> | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState("");
  const [userIdFilter, setUserIdFilter] = useState(filterUserId || "");
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const canKickSession = hasPermission(getAdminInfo()?.role ?? "admin", "user_kick_session");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [sessions, setSessions] = useState<PaginatedData<Session> | null>(null);
  const [sessionPage, setSessionPage] = useState(1);
  const [devices, setDevices] = useState<PaginatedData<DeviceItem> | null>(null);
  const [devicePage, setDevicePage] = useState(1);
  const [pets, setPets] = useState<PaginatedData<PetItem> | null>(null);
  const [petPage, setPetPage] = useState(1);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await request<PaginatedData<User>>("/user/list", {
        page, page_size: pageSize,
        keyword: keyword || undefined,
        user_id: filterUserId || userIdFilter || undefined,
      });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, filterUserId, userIdFilter]);

  useEffect(() => { fetchList(); }, [fetchList]);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) openDetail(id);
  }, [searchParams]);

  async function openDetail(userId: string) {
    setDrawerOpen(true);
    setDetail(null);
    setSessions(null);
    setDevices(null);
    setPets(null);
    setSessionPage(1);
    setDevicePage(1);
    setPetPage(1);
    setDetail(await request<UserDetail>("/user/detail", { id: userId }));
    fetchUserSessions(userId, 1);
    fetchUserDevices(userId, 1);
    fetchUserPets(userId, 1);
  }

  async function fetchUserSessions(userId: string, pg: number) {
    setSessions(await request<PaginatedData<Session>>("/user/session-list", { user_id: userId, page: pg, page_size: 10 }));
  }

  async function fetchUserDevices(userId: string, pg: number) {
    setDevices(await request<PaginatedData<DeviceItem>>("/device/list", { user_id: userId, page: pg, page_size: 10 }));
  }

  async function fetchUserPets(userId: string, pg: number) {
    setPets(await request<PaginatedData<PetItem>>("/pet/list", { user_id: userId, page: pg, page_size: 10 }));
  }

  async function kickSession(sessionId: string) {
    try {
      await request("/user/kick-session", { session_id: sessionId });
      message.success("已踢出");
      if (detail) fetchUserSessions(detail.id, sessionPage);
    } catch (err: any) {
      message.error(err.message);
    }
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setDetail(null);
  }

  const columns: ColumnsType<User> = [
    { title: "用户 ID", dataIndex: "id", width: 360, ellipsis: true, render: (v) => <CopyableText text={v} /> },
    { title: "昵称", dataIndex: "nickname", render: (v) => v || "-" },
    { title: "手机号", dataIndex: "phone", render: (v) => v || "-" },
    { title: "邮箱", dataIndex: "email", render: (v) => v || "-" },
    {
      title: "认证方式", dataIndex: "auth_providers", render: (providers: string[]) =>
        providers.length ? providers.map((p) => <Tag key={p}>{AUTH_PROVIDER_LABELS[p] ?? p}</Tag>) : "-",
    },
    { title: "注册时间", dataIndex: "created_at", render: (v) => formatTime(v) },
    {
      title: "操作", width: 80, render: (_, r) => (
        <Button type="link" size="small" icon={<Eye size={14} />} onClick={() => openDetail(r.id)}>详情</Button>
      ),
    },
  ];

  const sessionColumns: ColumnsType<Session> = [
    { title: "设备类型", dataIndex: "device_type", render: (v) => v || "-" },
    { title: "设备", dataIndex: "device", render: (v) => v || "-" },
    { title: "系统", dataIndex: "os", render: (v) => v || "-" },
    { title: "IP", dataIndex: "ip", render: (v) => v || "-" },
    { title: "状态", dataIndex: "status", render: (v) => <Tag color={sessionStatusColor(v)}>{formatSessionStatus(v)}</Tag> },
    { title: "最后活跃", dataIndex: "last_active_at", render: (v) => formatTime(v) },
    {
      title: "操作", width: 70, render: (_, r) =>
        r.status === "active" && canKickSession ? <Button size="small" danger onClick={() => kickSession(r.id)}>踢出</Button> : "-",
    },
  ];

  const deviceColumns: ColumnsType<DeviceItem> = [
    { title: "设备 ID", dataIndex: "id", ellipsis: true, render: (v) => <CopyableText text={v} /> },
    { title: "激活码", dataIndex: "activation_code", render: (v) => <CopyableText text={v} /> },
    { title: "绑定宠物", dataIndex: "pet_id", render: (v) => v ? <Tag color="green">已绑定</Tag> : <Tag>未绑定</Tag> },
    { title: "激活时间", dataIndex: "activated_at", render: (v) => formatTime(v) },
  ];

  const petColumns: ColumnsType<PetItem> = [
    { title: "名字", dataIndex: "name" },
    { title: "品种", dataIndex: "breed", render: (v) => v || "-" },
    { title: "状态", dataIndex: "status", render: (v) => <Tag color={v === "lost" ? "red" : "green"}>{v === "lost" ? "走丢" : "正常"}</Tag> },
    { title: "设备", dataIndex: "device_id", render: (v) => v ? <Tag color="blue">已绑定</Tag> : <Tag>未绑定</Tag> },
    { title: "创建时间", dataIndex: "created_at", render: (v) => formatTime(v) },
  ];

  const tabItems = detail ? [
    {
      key: "info",
      label: "基本信息",
      children: (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="用户 ID"><CopyableText text={detail.id} /></Descriptions.Item>
          <Descriptions.Item label="昵称">{detail.nickname || "-"}</Descriptions.Item>
          <Descriptions.Item label="手机号">{detail.phone || "-"}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{detail.email || "-"}</Descriptions.Item>
          <Descriptions.Item label="注册时间">{formatTime(detail.created_at)}</Descriptions.Item>
          <Descriptions.Item label="认证方式">
            {detail.auth_providers.map((p) => <Tag key={p}>{AUTH_PROVIDER_LABELS[p] ?? p}</Tag>)}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: "sessions",
      label: `登录历史${sessions ? ` (${sessions.total})` : ""}`,
      children: (
        <Table rowKey="id" columns={sessionColumns} dataSource={sessions?.list} size="small"
          pagination={{
            current: sessions?.page, pageSize: 10, total: sessions?.total,
            showTotal: (t) => `共 ${t} 条`, size: "small",
            onChange: (p) => { setSessionPage(p); fetchUserSessions(detail.id, p); },
          }} />
      ),
    },
    {
      key: "devices",
      label: `设备${devices ? ` (${devices.total})` : ""}`,
      children: (
        <>
          <Table rowKey="id" columns={deviceColumns} dataSource={devices?.list} size="small"
            pagination={{
              current: devices?.page, pageSize: 10, total: devices?.total,
              showTotal: (t) => `共 ${t} 条`, size: "small",
              onChange: (p) => { setDevicePage(p); fetchUserDevices(detail.id, p); },
            }} />
          {(devices?.total ?? 0) > 0 && (
            <div style={{ textAlign: "right", marginTop: 8 }}>
              <Button type="link" size="small" onClick={() => router.push(`/devices?user_id=${detail.id}`)}>在设备列表中查看 →</Button>
            </div>
          )}
        </>
      ),
    },
    {
      key: "pets",
      label: `宠物${pets ? ` (${pets.total})` : ""}`,
      children: (
        <>
          <Table rowKey="id" columns={petColumns} dataSource={pets?.list} size="small"
            pagination={{
              current: pets?.page, pageSize: 10, total: pets?.total,
              showTotal: (t) => `共 ${t} 条`, size: "small",
            onChange: (p) => { setPetPage(p); fetchUserPets(detail.id, p); },
            }} />
          {(pets?.total ?? 0) > 0 && (
            <div style={{ textAlign: "right", marginTop: 8 }}>
              <Button type="link" size="small" onClick={() => router.push(`/pets?user_id=${detail.id}`)}>在宠物列表中查看 →</Button>
            </div>
          )}
        </>
      ),
    },
  ] : [];

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>手机号 / 昵称</div>
          <Input.Search placeholder="搜索" value={keyword} onChange={(e) => setKeyword(e.target.value)}
            onSearch={() => { setPage(1); }} style={{ width: 220 }} allowClear />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>用户 ID</div>
          <Input placeholder="输入后回车搜索" value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)}
            onPressEnter={() => { setPage(1); fetchList(); }} style={{ width: 320 }} allowClear
            onClear={() => { setUserIdFilter(""); }} />
        </div>
        <div style={{ flex: 1 }} />
        {(keyword || userIdFilter) && (
          <Button onClick={() => { setKeyword(""); setUserIdFilter(""); setPage(1); router.push("/users"); }}>重置</Button>
        )}
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.list}
        loading={loading}
        pagination={{
          current: data?.page,
          pageSize: data?.page_size,
          total: data?.total,
          showTotal: (total) => `共 ${total} 条`,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />

      <Drawer
        title={detail ? `${detail.nickname || detail.phone || "用户"} 的详情` : "用户详情"}
        open={drawerOpen}
        onClose={closeDrawer}
        size="large"
        destroyOnClose
      >
        <Tabs items={tabItems} defaultActiveKey="info" />
      </Drawer>
    </div>
  );
}
