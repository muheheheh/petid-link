"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Layout, Menu, Button, Dropdown, Modal, Form, Input, App, theme } from "antd";
import {
  ExpandOutlined, CompressOutlined,
} from "@ant-design/icons";
import {
  Settings, Users, Smartphone, LogOut,
  ChevronLeft, ChevronRight,
  Sun, Moon, PawPrint, KeyRound, ChevronDown,
  Home, FileCode, Code,
} from "lucide-react";
import { isAuthenticated, getAdminInfo, logout, setAdminInfo, type AdminRole } from "@/lib/auth";
import { isMenuVisible } from "@/lib/permission";
import { request } from "@/lib/api";
import { useThemeMode } from "@/lib/theme";
import TabBar from "@/components/tab-bar";

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: "/",
    icon: <Home size={16} />,
    label: "首页",
  },
  {
    key: "user",
    icon: <Users size={16} />,
    label: "用户管理",
    children: [
      { key: "/users", label: "用户列表" },
    ],
  },
  {
    key: "pet",
    icon: <PawPrint size={16} />,
    label: "宠物管理",
    children: [
      { key: "/pets", label: "宠物列表" },
      { key: "/scan-logs", label: "扫码记录" },
    ],
  },
  {
    key: "device",
    icon: <Smartphone size={16} />,
    label: "设备管理",
    children: [
      { key: "/devices", label: "设备列表" },
    ],
  },
  {
    key: "system",
    icon: <Settings size={16} />,
    label: "系统管理",
    children: [
      { key: "/managers", label: "账号管理" },
      { key: "/manager-sessions", label: "登录日志" },
    ],
  },
  {
    key: "dev",
    icon: <Code size={16} />,
    label: "开发工具",
    children: [
      { key: "/api-docs", label: "接口文档" },
    ],
  },
];

const API_REFERENCE_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api/admin", "/api/reference") || "http://localhost:3000/api/reference";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [firstTabActive, setFirstTabActive] = useState(true);
  const [role, setRole] = useState<AdminRole>("admin");
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdForm] = Form.useForm();
  const { message } = App.useApp();
  const { mode, toggle: toggleTheme } = useThemeMode();
  const { token: { colorBgContainer, colorBorderSecondary, borderRadiusLG } } = theme.useToken();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      const info = getAdminInfo();
      if (info) {
        setRole(info.role);
        setReady(true);
      }
      request<{ id: string; username: string; nickname: string | null; role: AdminRole }>("/auth/me").then((me) => {
        setAdminInfo(me);
        setRole(me.role);
        setReady(true);
      }).catch(() => {
        setReady(true);
      });
    }
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(() => {
      request("/auth/heartbeat").catch(() => {});
    }, 30000);
    return () => clearInterval(timer);
  }, [ready]);

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  if (!ready) return null;

  const adminInfo = getAdminInfo();
  const displayName = adminInfo?.nickname || adminInfo?.username || "用户";
  const selectedKey = pathname === "/" ? "/" : "/" + pathname.split("/").filter(Boolean)[0];
  const filteredMenuItems = menuItems.map((group) => {
    if (!("children" in group)) return group;
    return {
      ...group,
      children: group.children?.filter((item) => isMenuVisible(item.key, role)),
    };
  }).filter((group) => !("children" in group) || (group.children && group.children.length > 0));
  const openKey = filteredMenuItems.find((g) => "children" in g && g.children?.some((c) => c.key === selectedKey))?.key;
  const isDark = mode === "dark";

  const siderStyle = {
    background: colorBgContainer,
    borderRight: `1px solid ${colorBorderSecondary}`,
  };

  const logoStyle: React.CSSProperties = {
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontFamily: "'ZCOOL KuaiLe', cursive",
    fontSize: collapsed ? 18 : 22,
    background: "linear-gradient(135deg, #ff6b6b, #ffa940, #1677ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    userSelect: "none",
    cursor: "pointer",
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        style={siderStyle}
      >
        <div style={logoStyle}>
          <span style={{ fontSize: collapsed ? 22 : 24 }}>🐾</span>
          {!collapsed && <span>寻宠</span>}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={openKey ? [openKey] : []}
          items={filteredMenuItems}
          onClick={({ key }) => {
            if (key === "/api-docs") {
              window.open(API_REFERENCE_URL, "_blank");
              return;
            }
            router.push(key);
          }}
          style={{ background: "transparent", borderInlineEnd: "none" }}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: "0 24px", background: colorBgContainer, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Button type="text" icon={collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />} onClick={() => setCollapsed(!collapsed)} />
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Button type="text" icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />} onClick={toggleFullscreen} title={isFullscreen ? "退出全屏" : "全屏"} />
            <Button type="text" icon={isDark ? <Sun size={16} /> : <Moon size={16} />} onClick={() => toggleTheme()} title={isDark ? "切换亮色" : "切换暗色"} />
            <Dropdown menu={{
              items: [
                { key: "pwd", icon: <KeyRound size={14} />, label: "修改密码" },
                { type: "divider" },
                { key: "logout", icon: <LogOut size={14} />, label: "退出登录", danger: true },
              ],
              onClick: ({ key }) => {
                if (key === "pwd") { pwdForm.resetFields(); setPwdModalOpen(true); }
                if (key === "logout") logout();
              },
            }}>
              <Button type="text" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                {displayName} <ChevronDown size={14} />
              </Button>
            </Dropdown>
          </div>
        </Header>
        <TabBar onFirstTabActive={setFirstTabActive} />
        <Content style={{ margin: "0 24px 24px", padding: 24, background: colorBgContainer, borderRadius: firstTabActive ? `0 ${borderRadiusLG}px ${borderRadiusLG}px ${borderRadiusLG}px` : borderRadiusLG }}>
          {children}
        </Content>
      </Layout>

      <Modal title="修改密码" open={pwdModalOpen} onCancel={() => setPwdModalOpen(false)} onOk={async () => {
        const values = await pwdForm.validateFields();
        try {
          await request("/auth/change-password", { old_password: values.old_password, new_password: values.new_password });
          message.success("密码修改成功，请重新登录");
          setPwdModalOpen(false);
          setTimeout(logout, 1000);
        } catch (err: any) {
          message.error(err.message);
        }
      }}>
        <Form form={pwdForm} layout="vertical">
          <Form.Item label="旧密码" name="old_password" rules={[{ required: true, message: "请输入旧密码" }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item label="新密码" name="new_password" rules={[{ required: true, message: "请输入新密码" }, { min: 6, message: "至少6位" }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item label="确认新密码" name="confirm_password" dependencies={["new_password"]} rules={[
            { required: true, message: "请确认新密码" },
            ({ getFieldValue }) => ({ validator(_, value) { return !value || getFieldValue("new_password") === value ? Promise.resolve() : Promise.reject(new Error("两次密码不一致")); } }),
          ]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
