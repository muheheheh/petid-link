"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, App, theme } from "antd";
import { login, ApiError } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const { token } = theme.useToken();

  async function handleFinish(values: { username: string; password: string }) {
    setLoading(true);
    try {
      await login(values.username, values.password);
      router.push("/");
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  const isDark = token.colorBgContainer !== "#ffffff" && token.colorBgContainer !== "#fff";

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        html, body { height: 100%; overflow: hidden; }
        .login-card .ant-input-outlined,
        .login-card .ant-input-password.ant-input-outlined {
          border-radius: 12px;
          height: 48px;
        }
      `}</style>

      <div style={{
        height: "100vh",
        overflow: "hidden",
        backgroundImage: "url(/login-bg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center bottom",
        backgroundRepeat: "no-repeat",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "40px 80px",
      }}>
        <div className="login-card" style={{
          width: 420,
          padding: "48px 40px",
          borderRadius: 16,
          background: isDark ? "rgba(0, 0, 0, 0.65)" : "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: isDark ? "0 8px 32px rgba(0, 0, 0, 0.4)" : "0 8px 32px rgba(0, 0, 0, 0.12)",
          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.3)"}`,
          animation: "fadeInUp 0.6s ease-out",
        }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🐾</div>
            <h2 style={{
              fontFamily: "'ZCOOL KuaiLe', cursive",
              fontSize: 26,
              margin: 0,
              background: "linear-gradient(135deg, #ff6b6b, #ffa940, #1677ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>寻宠 · 运营平台</h2>
            <p style={{ color: token.colorTextSecondary, marginTop: 8, fontSize: 14 }}>登录以继续</p>
          </div>
          <Form layout="vertical" onFinish={handleFinish} size="large">
            <Form.Item label="用户名" name="username" rules={[{ required: true, message: "请输入用户名" }]}>
              <Input placeholder="请输入用户名" style={{ height: 48, borderRadius: 12 }} />
            </Form.Item>
            <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }]}>
              <Input.Password placeholder="请输入密码" style={{ height: 48, borderRadius: 12 }} />
            </Form.Item>
            <Form.Item style={{ marginTop: 32 }}>
              <Button type="primary" htmlType="submit" loading={loading} block size="large"
                style={{
                  height: 48, borderRadius: 12, fontSize: 16, fontWeight: 500,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  boxShadow: "0 4px 16px rgba(102, 126, 234, 0.4)",
                }}>
                登录
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </>
  );
}
