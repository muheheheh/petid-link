# 认证机制技术方案

## 方案概述

采用 JWT + Session 表的混合方案。JWT 负责传输和防篡改，Session 表负责状态管理（多设备登录、踢人、续期）。

## 核心流程

### 登录

1. 客户端通过第三方平台（微信/Google）完成身份验证，拿到 code
2. 后端用 code 换取用户身份信息（openid 等），查找或创建用户
3. 创建 session 记录，签发 JWT（payload 包含 `sessionId` + `userId`）
4. 返回 token 给客户端

### 鉴权

1. 客户端请求时在 `Authorization: Bearer <token>` 中携带 JWT
2. 后端解码 JWT，取出 `sessionId`
3. 查 sessions 表，确认 `status === "active"` 且未过期
4. 通过则放行，同时更新 `last_active_at`

### 自动续期（滑动续期）

- Session 有效期：30 天
- 续期阈值：剩余不到 7 天时自动续期
- 续期时更新 session 的 `expires_at`，签发新 JWT
- 新 token 通过响应头 `X-Refreshed-Token` 返回
- 客户端在响应拦截器中检测该 header，有则替换本地 token

### 登出

- 主动登出：将 session 状态设为 `logged_out`
- 后台踢人：将 session 状态设为 `kicked`
- 踢全部设备：将该用户所有 session 状态设为 `kicked`

## 登录路由

| 路由                                | 说明                                   |
| ----------------------------------- | -------------------------------------- |
| `POST /api/auth/wechat/miniprogram` | 小程序登录（login code + 手机号 code） |
| `POST /api/auth/wechat/app`         | App 拉起微信授权                       |
| `POST /api/auth/wechat/qrcode`      | H5 扫码登录（PC 网页）                 |
| `POST /api/auth/wechat/mp`          | 微信公众号 H5 授权                     |
| `POST /api/auth/google`             | Google 登录                            |
| `POST /api/auth/logout`             | 登出（需鉴权）                         |

## 设备信息采集

所有客户端统一通过 `X-Client-Info` 请求头传递设备信息，内容为 JSON 经 Base64 + 字节偏移混淆后的字符串。

### ClientInfo 字段

```json
{
  "app": "petid-link",
  "type": "miniprogram",
  "device": "iPhone 15 Pro",
  "os": "iOS",
  "os_version": "17.2"
}
```

| 字段       | 说明               | 示例                                               |
| ---------- | ------------------ | -------------------------------------------------- |
| app        | 应用标识（固定值） | `petid-link`                                       |
| type       | 客户端类型         | `miniprogram` / `h5` / `android` / `ios` / `admin` |
| device     | 设备型号           | `iPhone 15 Pro` / `Pixel 8`                        |
| os         | 系统               | `iOS` / `Android` / `macOS` / `Windows`            |
| os_version | 系统版本           | `17.2` / `14`                                      |

后端额外从请求头提取 `ip`（X-Forwarded-For）和 `user_agent`（User-Agent），一并存入 session。

## Session 表结构

| 字段           | 类型      | 说明                               |
| -------------- | --------- | ---------------------------------- |
| id             | text PK   | sessionId，写进 JWT                |
| user_id        | text FK   | 关联用户                           |
| app            | text      | 应用标识                           |
| device_type    | text      | 客户端类型                         |
| device         | text      | 设备型号                           |
| os             | text      | 系统                               |
| os_version     | text      | 系统版本                           |
| ip             | text      | 登录 IP                            |
| user_agent     | text      | 原始 UA                            |
| status         | text      | `active` / `logged_out` / `kicked` |
| last_active_at | timestamp | 最后活跃时间                       |
| logged_out_at  | timestamp | 登出时间                           |
| expires_at     | timestamp | 过期时间                           |
| created_at     | timestamp | 创建时间                           |

## JWT 相关

- 算法：HS256
- Secret：从环境变量 `JWT_SECRET` 读取
- Payload：`{ sessionId, userId, exp }`
- 更换 Secret 会导致全员强制下线，无需支持多版本
