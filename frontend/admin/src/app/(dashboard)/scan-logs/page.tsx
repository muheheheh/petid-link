"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { request, type PaginatedData } from "@/lib/api";
import { formatTime } from "@/lib/utils";
import { Table, Button, Input, App } from "antd";
import CopyableText from "@/components/copyable-text";
import type { ColumnsType } from "antd/es/table";

interface ScanLog {
  id: string;
  device_id: string | null;
  pet_id: string | null;
  pet_name: string | null;
  ip: string | null;
  user_agent: string | null;
  latitude: string | null;
  longitude: string | null;
  scanned_at: number | null;
}

export default function ScanLogsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterDeviceId = searchParams.get("device_id") || undefined;
  const filterPetId = searchParams.get("pet_id") || undefined;
  const [data, setData] = useState<PaginatedData<ScanLog> | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [deviceIdFilter, setDeviceIdFilter] = useState(filterDeviceId || "");
  const [petIdFilter, setPetIdFilter] = useState(filterPetId || "");
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await request<PaginatedData<ScanLog>>("/scan-log/list", {
        page, page_size: pageSize,
        device_id: filterDeviceId || deviceIdFilter || undefined,
        pet_id: filterPetId || petIdFilter || undefined,
      });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterDeviceId, deviceIdFilter, filterPetId, petIdFilter]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const columns: ColumnsType<ScanLog> = [
    { title: "设备 ID", dataIndex: "device_id", width: 360, ellipsis: true, render: (v) => v ? <CopyableText text={v} /> : "-" },
    { title: "宠物", dataIndex: "pet_name", render: (v, r) => r.pet_id ? (
      <Button type="link" size="small" style={{ padding: 0 }} onClick={() => router.push(`/pets?id=${r.pet_id}`)}>{v || r.pet_id.slice(0, 8)}</Button>
    ) : "-" },
    { title: "IP", dataIndex: "ip", render: (v) => v || "-" },
    { title: "位置", render: (_, r) => r.latitude && r.longitude ? `${r.latitude}, ${r.longitude}` : "-" },
    { title: "UA", dataIndex: "user_agent", ellipsis: true, render: (v) => v || "-" },
    { title: "扫码时间", dataIndex: "scanned_at", render: (v) => formatTime(v) },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>设备 ID</div>
          <Input placeholder="输入后回车搜索" value={deviceIdFilter} onChange={(e) => setDeviceIdFilter(e.target.value)}
            onPressEnter={() => { setPage(1); fetchList(); }} style={{ width: 320 }} allowClear
            onClear={() => { setDeviceIdFilter(""); }} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>宠物 ID</div>
          <Input placeholder="输入后回车搜索" value={petIdFilter} onChange={(e) => setPetIdFilter(e.target.value)}
            onPressEnter={() => { setPage(1); fetchList(); }} style={{ width: 320 }} allowClear
            onClear={() => { setPetIdFilter(""); }} />
        </div>
        <div style={{ flex: 1 }} />
        {(deviceIdFilter || petIdFilter) && (
          <Button onClick={() => { setDeviceIdFilter(""); setPetIdFilter(""); setPage(1); router.push("/scan-logs"); }}>重置</Button>
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
    </div>
  );
}
