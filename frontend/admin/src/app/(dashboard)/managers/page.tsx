"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { request, type PaginatedData } from "@/lib/api";
import { formatTime } from "@/lib/utils";
import { getAdminInfo } from "@/lib/auth";
import { hasPermission, getRoleLabel, canManageRole, getCreatableRoles } from "@/lib/permission";
import { Table, Button, Input, Space, Modal, Form, Tag, Select, App } from "antd";
import { Plus, LockOpen } from "lucide-react";
import type { ColumnsType } from "antd/es/table";

interface Admin {
  id: string;
  username: string;
  nickname: string | null;
  email: string | null;
  role: string;
  online: boolean;
  last_active_at: number | null;
  created_at: number | null;
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: "red",
  admin: "blue",
  operator: "green",
  developer: "purple",
};

export default function ManagersPage() {
  const [data, setData] = useState<PaginatedData<Admin> | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<string | null>(null);
  const [usernameUnlocked, setUsernameUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [resetPwdForm] = Form.useForm();
  const [resetPwdId, setResetPwdId] = useState<string | null>(null);
  const { message, modal } = App.useApp();
  const router = useRouter();
  const adminInfo = getAdminInfo();
  const role = adminInfo?.role ?? "admin";
  const canCreate = hasPermission(role, "manager_create");
  const canDelete = hasPermission(role, "manager_delete");
  const canViewSessions = hasPermission(role, "manager_sessions");
  const creatableRoles = getCreatableRoles(role);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await request<PaginatedData<Admin>>("/manager/list", {page, page_size: pageSize, keyword: keyword || undefined });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword]);

  useEffect(() => { fetchList(); }, [fetchList]);

  function openCreate() {
    setEditId(null);
    setEditRole(null);
    setUsernameUnlocked(false);
    form.resetFields();
    setModalOpen(true);
  }

  function openEdit(admin: Admin) {
    setEditId(admin.id);
    setEditRole(admin.role);
    setUsernameUnlocked(false);
    form.setFieldsValue({ username: admin.username, nickname: admin.nickname, email: admin.email, role: admin.role });
    setModalOpen(true);
  }

  async function handleSubmit() {
    const values = await form.validateFields();
    try {
      if (editId) {
        await request("/manager/update", {
          id: editId,
          username: usernameUnlocked ? values.username : undefined,
          nickname: values.nickname || undefined,
          email: values.email || undefined,
          role: (creatableRoles.length > 0 && editRole && canManageRole(role, editRole)) ? values.role : undefined,
        });
        message.success("更新成功");
      } else {
        await request("/manager/create", values);
        message.success("创建成功");
      }
      setModalOpen(false);
      fetchList();
    } catch (err: any) {
      message.error(err.message);
    }
  }

  async function handleResetPassword() {
    const values = await resetPwdForm.validateFields();
    try {
      await request("/manager/reset-password", { id: resetPwdId, new_password: values.new_password });
      message.success("密码已重置");
      setResetPwdId(null);
    } catch (err: any) {
      message.error(err.message);
    }
  }

  function handleDelete(id: string) {
    modal.confirm({
      title: "确定删除该管理员？",
      onOk: async () => {
        try {
          await request("/manager/delete", { id });
          message.success("删除成功");
          fetchList();
        } catch (err: any) {
          message.error(err.message);
        }
      },
    });
  }

  const columns: ColumnsType<Admin> = [
    { title: "用户名", dataIndex: "username" },
    { title: "昵称", dataIndex: "nickname", render: (v) => v || "-" },
    { title: "角色", dataIndex: "role", render: (v) => <Tag color={ROLE_COLORS[v]}>{getRoleLabel(v)}</Tag> },
    { title: "邮箱", dataIndex: "email", render: (v) => v || "-" },
    { title: "创建时间", dataIndex: "created_at", render: (v) => formatTime(v) },
    { title: "在线状态", dataIndex: "online", width: 90, render: (v: boolean) => v ? <Tag color="green">在线</Tag> : <Tag>离线</Tag> },
    { title: "最后活跃", dataIndex: "last_active_at", render: (v: number | null) => v ? formatTime(v) : "-" },
    {
      title: "操作", render: (_, record) => {
        const isSelf = record.id === adminInfo?.id;
        const canManage = canManageRole(role, record.role);
        const showEdit = isSelf || canManage;
        const showResetPwd = canManage && !isSelf;
        const showDelete = canDelete && canManage && !isSelf;
        if (!showEdit && !showResetPwd && !showDelete) return "-";
        return (
       <Space>
            {showEdit && <Button size="small" onClick={() => openEdit(record)}>编辑</Button>}
            {showResetPwd && <Button size="small" onClick={() => { setResetPwdId(record.id); resetPwdForm.resetFields(); }}>重置密码</Button>}
            {showDelete && <Button size="small" danger onClick={() => handleDelete(record.id)}>删除</Button>}
          </Space>
        );
      },
    },
    ...(canViewSessions ? [{
      title: "登录日志", width: 100, render: (_: any, record: Admin) => {
        const canView = record.id === adminInfo?.id || canManageRole(role, record.role);
        return canView ? (
          <Button type="link" size="small" style={{ padding: 0 }} onClick={() => router.push(`/manager-sessions?admin_id=${record.id}`)}>查看 →</Button>
        ) : "-";
      },
    }] : []),
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>用户名 / 昵称</div>
          <Input.Search placeholder="搜索" value={keyword} onChange={(e) => setKeyword(e.target.value)}
            onSearch={() => { setPage(1); fetchList(); }} style={{ width: 220 }} allowClear />
        </div>
        <div style={{ flex: 1 }} />
        {canCreate && <Button type="primary" icon={<Plus size={14} />} onClick={openCreate}>新增账号</Button>}
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

      <Modal title={editId ? "编辑账号" : "新增账号"} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          {!editId ? (
            <Form.Item label="用户名" name="username" rules={[{ required: true, message: "请输入用户名" }]}>
              <Input />
            </Form.Item>
          ) : (
            <Form.Item label="用户名" name="username">
              <Input
                disabled={!usernameUnlocked}
                suffix={
                  editRole && canManageRole(role, editRole) && !usernameUnlocked ? (
                    <Button
                      type="text"
                      size="small"
                      icon={<LockOpen size={14} />}
                      style={{ padding: 0, height: "auto" }}
                      onClick={() => {
                        modal.confirm({
                          title: "确定修改用户名？",
                          content: "修改用户名会影响该账号的登录，请确认。",
                          onOk: () => setUsernameUnlocked(true),
                        });
                      }}
                    />
                  ) : <span />
                }
              />
            </Form.Item>
          )}
          {!editId && (
            <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }, { min: 6, message: "至少6位" }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item label="昵称" name="nickname">
            <Input />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input />
          </Form.Item>
          {creatableRoles.length > 0 && (!editId || (editRole && canManageRole(role, editRole))) && (
            <Form.Item label="角色" name="role" initialValue={editId ? undefined : creatableRoles[0]?.value}>
              <Select options={creatableRoles} />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal title="重置密码" open={!!resetPwdId} onOk={handleResetPassword} onCancel={() => setResetPwdId(null)} destroyOnHidden forceRender>
        <Form form={resetPwdForm} layout="vertical">
          <Form.Item label="新密码" name="new_password" rules={[{ required: true, message: "请输入新密码" }, { min: 6, message: "至少6位" }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="确认密码"
            name="confirm_password"
            dependencies={["new_password"]}
            rules={[
              { required: true, message: "请确认密码" },
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  !value || getFieldValue("new_password") === value
                    ? Promise.resolve()
                    : Promise.reject(new Error("两次密码不一致")),
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
