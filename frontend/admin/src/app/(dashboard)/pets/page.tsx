"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { request, type PaginatedData } from "@/lib/api";
import { formatTime } from "@/lib/utils";
import { Table, Button, Input, Tag, Modal, Descriptions, Select, Tooltip, App } from "antd";
import { Eye } from "lucide-react";
import CopyableText from "@/components/copyable-text";
import type { ColumnsType } from "antd/es/table";

interface Pet {
  id: string;
  name: string;
  avatar: string | null;
  gender: string | null;
  breed: string | null;
  status: string | null;
  user_id: string | null;
  user_nickname: string | null;
  device_id: string | null;
  created_at: number | null;
}

interface ContactItem {
  type: string;
  value: string;
}

const CONTACT_LABELS: Record<string, string> = {
  phone: "手机",
  wechat: "微信",
  qq: "QQ",
  email: "邮箱",
};

interface PetDetail extends Pet {
  description: string | null;
  contacts: ContactItem[] | null;
  contact_name: string | null;
  remark: string | null;
  images: string[] | null;
  user: { id: string; nickname: string | null; avatar: string | null; phone: string | null; email: string | null; created_at: number | null } | null;
  device: { id: string; activation_code: string; activated_at: number | null; bound_at: number | null } | null;
}

const GENDER_MAP: Record<string, string> = { male: "公", female: "母", unknown: "未知" };

export default function PetsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterUserId = searchParams.get("user_id") || undefined;
  const [data, setData] = useState<PaginatedData<Pet> | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState("");
  const [userIdFilter, setUserIdFilter] = useState(filterUserId || "");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<PetDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const { message } = App.useApp();

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await request<PaginatedData<Pet>>("/pet/list", {
        page, page_size: pageSize,
        keyword: keyword || undefined,
        user_id: filterUserId || userIdFilter || undefined,
        status: statusFilter.length ? statusFilter : undefined,
      });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, filterUserId, userIdFilter, statusFilter]);

  useEffect(() => { fetchList(); }, [fetchList]);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) showDetail(id);
  }, [searchParams]);

  async function showDetail(petId: string) {
    setDetailLoading(true);
    try {
      const d = await request<PetDetail>("/pet/detail", { id: petId });
      setDetail(d);
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setDetailLoading(false);
    }
  }

  const columns: ColumnsType<Pet> = [
    { title: "宠物 ID", dataIndex: "id", width: 360, ellipsis: true, render: (v) => <CopyableText text={v} /> },
    { title: "名字", dataIndex: "name" },
    { title: "用户", dataIndex: "user_id", render: (v, r) => {
      if (!v) return "-";
      const label = r.user_nickname || v.slice(0, 8);
      return (
        <Tooltip title={<CopyableText text={v} copyMessage="用户ID已复制" />} styles={{ root: { maxWidth: 420 } }}>
          <Button type="link" size="small" style={{ padding: 0 }} onClick={() => router.push(`/users?user_id=${v}`)}>{label}</Button>
        </Tooltip>
      );
    }},
    { title: "品种", dataIndex: "breed", render: (v) => v || "-" },
    { title: "性别", dataIndex: "gender", render: (v) => v ? (GENDER_MAP[v] ?? v) : "-" },
    {
      title: "状态", dataIndex: "status", render: (v) => {
        if (v === "lost") return <Tag color="red">走丢</Tag>;
        return <Tag color="green">正常</Tag>;
      },
    },
    { title: "创建时间", dataIndex: "created_at", render: (v) => formatTime(v) },
    {
      title: "操作", width: 80, render: (_, r) => (
        <Button type="link" size="small" icon={<Eye size={14} />} onClick={() => showDetail(r.id)}>详情</Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>名字 / 品种</div>
          <Input.Search placeholder="搜索" value={keyword} onChange={(e) => setKeyword(e.target.value)}
            onSearch={() => { setPage(1); }} style={{ width: 220 }} allowClear />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>用户 ID</div>
          <Input placeholder="输入后回车搜索" value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)}
            onPressEnter={() => { setPage(1); fetchList(); }} style={{ width: 320 }} allowClear
            onClear={() => { setUserIdFilter(""); }} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>状态</div>
          <Select mode="multiple" placeholder="全部" value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            style={{ minWidth: 180 }} allowClear
            options={[
              { label: "正常", value: "normal" },
              { label: "走丢", value: "lost" },
            ]} />
        </div>
        <div style={{ flex: 1 }} />
        {(keyword || userIdFilter || statusFilter.length > 0) && (
          <Button onClick={() => { setKeyword(""); setUserIdFilter(""); setStatusFilter([]); setPage(1); router.push("/pets"); }}>重置</Button>
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

      <Modal title="宠物详情" open={!!detail} onCancel={() => setDetail(null)} footer={null} width={640} loading={detailLoading}>
        {detail && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="ID" span={2}><CopyableText text={detail.id} /></Descriptions.Item>
            <Descriptions.Item label="名字">{detail.name}</Descriptions.Item>
            <Descriptions.Item label="品种">{detail.breed || "-"}</Descriptions.Item>
            <Descriptions.Item label="性别">{detail.gender ? (GENDER_MAP[detail.gender] ?? detail.gender) : "-"}</Descriptions.Item>
            <Descriptions.Item label="状态">
              {detail.status === "lost" ? <Tag color="red">走丢</Tag> : <Tag color="green">正常</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>{detail.description || "-"}</Descriptions.Item>
            <Descriptions.Item label="联系人">{detail.contact_name || "-"}</Descriptions.Item>
            <Descriptions.Item label="联系方式">
              {detail.contacts?.map((c, i) => <div key={i}>{CONTACT_LABELS[c.type] || c.type}：{c.value}</div>) || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>{detail.remark || "-"}</Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>{formatTime(detail.created_at)}</Descriptions.Item>
            <Descriptions.Item label="主人" span={2}>
              {detail.user ? (
                <Button type="link" size="small" style={{ padding: 0 }} onClick={() => { setDetail(null); router.push(`/users?user_id=${detail.user!.id}`); }}>
                  在用户列表中查看 →
                </Button>
              ) : "未关联"}
            </Descriptions.Item>
            <Descriptions.Item label="设备" span={2}>
              {detail.device ? (
                <Button type="link" size="small" style={{ padding: 0 }} onClick={() => { setDetail(null); router.push(`/devices?id=${detail.device!.id}`); }}>
                  在设备列表中查看 →
                </Button>
              ) : "未绑定"}
            </Descriptions.Item>
            <Descriptions.Item label="扫码记录" span={2}>
              <Button type="link" size="small" style={{ padding: 0 }} onClick={() => { setDetail(null); router.push(`/scan-logs?pet_id=${detail.id}`); }}>
                查看扫码记录 →
              </Button>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
