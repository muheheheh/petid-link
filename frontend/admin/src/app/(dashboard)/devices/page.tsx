"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { request, type PaginatedData } from "@/lib/api";
import { formatTime } from "@/lib/utils";
import { getDeviceScanUrl } from "@/lib/qrcode";
import { Table, Button, Input, InputNumber, Tag, Modal, Form, Descriptions, Space, Select, Tooltip, App } from "antd";
import { Plus, QrCode, Eye, Copy, Download } from "lucide-react";
import { getAdminInfo } from "@/lib/auth";
import { hasPermission } from "@/lib/permission";
import { QRCodeSVG } from "qrcode.react";
import CopyableText from "@/components/copyable-text";
import type { ColumnsType } from "antd/es/table";

interface Device {
  id: string;
  batch: string | null;
  user_id: string | null;
  user_nickname: string | null;
  pet_id: string | null;
  bound_at: number | null;
  created_at: number | null;
}

interface DeviceDetail {
  id: string;
  batch: string | null;
  user_id: string | null;
  pet_id: string | null;
  bound_at: number | null;
  created_at: number | null;
  user: { id: string; nickname: string | null; avatar: string | null; phone: string | null; email: string | null; created_at: number | null } | null;
  pet: { id: string; name: string; avatar: string | null; breed: string | null; status: string | null } | null;
}

export default function DevicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterUserId = searchParams.get("user_id") || undefined;
  const [data, setData] = useState<PaginatedData<Device> | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState("");
  const [userIdFilter, setUserIdFilter] = useState(filterUserId || "");
  const [batchFilter, setBatchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [qrDevice, setQrDevice] = useState<{ id: string } | null>(null);
  const [detailDevice, setDetailDevice] = useState<DeviceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form] = Form.useForm();
  const qrRef = useRef<HTMLDivElement>(null);
  const { message } = App.useApp();
  const canCreateDevice = hasPermission(getAdminInfo()?.role ?? "admin", "device_create");

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await request<PaginatedData<Device>>("/device/list", {
        page, page_size: pageSize,
        keyword: keyword || undefined,
        user_id: filterUserId || userIdFilter || undefined,
        batch: batchFilter || undefined,
        status: statusFilter.length ? statusFilter : undefined,
      });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, filterUserId, userIdFilter, batchFilter, statusFilter]);

  useEffect(() => { fetchList(); }, [fetchList]);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) showDetail(id);
  }, [searchParams]);

  async function handleCreate() {
    const values = await form.validateFields();
    try {
      const result = await request<{ ids: string[]; batch: string }>("/device/create", {
        count: values.count,
        batch: values.batch || undefined,
      });
      message.success(`成功生成 ${result.ids.length} 个设备，批次号：${result.batch}`);
      setCreateOpen(false);
      form.resetFields();
      fetchList();
    } catch (err: any) {
      message.error(err.message);
    }
  }

  async function showDetail(deviceId: string) {
    setDetailLoading(true);
    try {
      const detail = await request<DeviceDetail>("/device/detail", { id: deviceId });
      setDetailDevice(detail);
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setDetailLoading(false);
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    message.success("已复制");
  }

  function downloadQrCode(deviceId: string) {
    const svgEl = qrRef.current?.querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement("a");
      a.download = `device-${deviceId.slice(0, 8)}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  function statusTag(device: { user_id?: string | null; pet_id?: string | null }) {
    if (device.pet_id) return <Tag color="green">已绑定宠物</Tag>;
    if (device.user_id) return <Tag color="blue">已绑定用户</Tag>;
    return <Tag>未绑定</Tag>;
  }

  const columns: ColumnsType<Device> = [
    { title: "设备 ID", dataIndex: "id", width: 360, ellipsis: true, render: (v) => <CopyableText text={v} /> },
    { title: "批次", dataIndex: "batch", render: (v) => v ? <Tag>{v}</Tag> : "-" },
    { title: "用户", dataIndex: "user_id", render: (v, r) => {
      if (!v) return "-";
      const label = r.user_nickname || v.slice(0, 8);
      return (
        <Tooltip title={<CopyableText text={v} copyMessage="用户ID已复制" />} styles={{ root: { maxWidth: 420 } }}>
          <Button type="link" size="small" style={{ padding: 0 }} onClick={() => router.push(`/users?user_id=${v}`)}>{label}</Button>
        </Tooltip>
      );
    }},
    { title: "状态", render: (_, r) => statusTag(r) },
    { title: "绑定时间", dataIndex: "bound_at", render: (v) => formatTime(v) },
    { title: "创建时间", dataIndex: "created_at", render: (v) => formatTime(v) },
    {
      title: "操作",
      width: 160,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" icon={<QrCode size={14} />} onClick={() => setQrDevice(r)}>二维码</Button>
          <Button type="link" size="small" icon={<Eye size={14} />} onClick={() => showDetail(r.id)}>详情</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>设备 ID</div>
          <Input placeholder="输入后回车搜索" value={keyword} onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => { setPage(1); fetchList(); }} style={{ width: 320 }} allowClear
            onClear={() => { setKeyword(""); }} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>用户 ID</div>
          <Input placeholder="输入后回车搜索" value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)}
            onPressEnter={() => { setPage(1); fetchList(); }} style={{ width: 320 }} allowClear
            onClear={() => { setUserIdFilter(""); }} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>批次号</div>
          <Input placeholder="输入后回车搜索" value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}
            onPressEnter={() => { setPage(1); fetchList(); }} style={{ width: 200 }} allowClear
            onClear={() => { setBatchFilter(""); }} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>状态</div>
          <Select mode="multiple" placeholder="全部" value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            style={{ minWidth: 200 }} allowClear
            options={[
              { label: "未绑定", value: "unbound" },
              { label: "已绑定用户", value: "bound" },
              { label: "已绑定宠物", value: "bindPet" },
            ]} />
        </div>
        <div style={{ flex: 1 }} />
        {(keyword || userIdFilter || batchFilter || statusFilter.length > 0) && (
          <Button onClick={() => { setKeyword(""); setUserIdFilter(""); setBatchFilter(""); setStatusFilter([]); setPage(1); router.push("/devices"); }}>重置</Button>
        )}
        {canCreateDevice && <Button type="primary" icon={<Plus size={14} />} onClick={() => {
          const d = new Date();
          const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
          const time = `${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;
          form.setFieldsValue({ batch: `B${date}-${time}` });
          setCreateOpen(true);
        }}>批量生成</Button>}
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

      {/* 批量生成弹窗 */}
      <Modal title="批量生成设备" open={createOpen} onOk={handleCreate} onCancel={() => setCreateOpen(false)}>
        <Form form={form} layout="vertical" initialValues={{ count: 10 }}>
          <Form.Item label="数量" name="count" rules={[{ required: true, message: "请输入数量" }]}>
            <InputNumber min={1} max={1000} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="批次号" name="batch" tooltip="留空则自动生成">
            <Input placeholder={`例如 B${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-001`} allowClear />
          </Form.Item>
        </Form>
      </Modal>

      {/* 二维码弹窗 */}
      <Modal title="设备二维码" open={!!qrDevice} onCancel={() => setQrDevice(null)} footer={null} width={400} zIndex={1100}>
        {qrDevice && (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div ref={qrRef}>
              <QRCodeSVG value={getDeviceScanUrl(qrDevice.id)} size={240} level="M" />
            </div>
            <div style={{ marginTop: 16, fontFamily: "monospace", fontSize: 12, color: "#888", wordBreak: "break-all" }}>
              {getDeviceScanUrl(qrDevice.id)}
            </div>
            <Space style={{ marginTop: 16 }}>
              <Button icon={<Copy size={14} />} onClick={() => copyText(getDeviceScanUrl(qrDevice.id))}>复制链接</Button>
              <Button icon={<Download size={14} />} onClick={() => downloadQrCode(qrDevice.id)}>下载二维码</Button>
            </Space>
          </div>
        )}
      </Modal>

      {/* 设备详情弹窗 */}
      <Modal title="设备详情" open={!!detailDevice} onCancel={() => setDetailDevice(null)} footer={null} width={600} loading={detailLoading}>
        {detailDevice && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="设备 ID" span={2}>
              <CopyableText text={detailDevice.id} />
            </Descriptions.Item>
            <Descriptions.Item label="批次">{detailDevice.batch || "-"}</Descriptions.Item>
            <Descriptions.Item label="状态">{statusTag(detailDevice)}</Descriptions.Item>
            <Descriptions.Item label="绑定时间">{formatTime(detailDevice.bound_at)}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatTime(detailDevice.created_at)}</Descriptions.Item>
            {detailDevice.user && (
              <>
                <Descriptions.Item label="用户昵称">
                  <Button type="link" size="small" style={{ padding: 0 }} onClick={() => { setDetailDevice(null); router.push(`/users?user_id=${detailDevice.user!.id}`); }}>
                    {detailDevice.user.nickname || detailDevice.user.phone || detailDevice.user.id.slice(0, 8)}
                  </Button>
                </Descriptions.Item>
                <Descriptions.Item label="手机号">{detailDevice.user.phone || "-"}</Descriptions.Item>
              </>
            )}
            {detailDevice.pet && (
              <>
                <Descriptions.Item label="宠物名称">
                  <Button type="link" size="small" style={{ padding: 0 }} onClick={() => { setDetailDevice(null); router.push(`/pets?id=${detailDevice.pet!.id}`); }}>
                    {detailDevice.pet.name}
                  </Button>
                </Descriptions.Item>
                <Descriptions.Item label="品种">{detailDevice.pet.breed || "-"}</Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="二维码" span={2}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <QRCodeSVG value={getDeviceScanUrl(detailDevice.id)} size={80} level="M" />
                <Button type="link" size="small" onClick={() => setQrDevice(detailDevice)}>查看大图</Button>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="扫码记录" span={2}>
              <Button type="link" size="small" style={{ padding: 0 }} onClick={() => { setDetailDevice(null); router.push(`/scan-logs?device_id=${detailDevice.id}`); }}>
                查看扫码记录 →
              </Button>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
