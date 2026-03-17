-- ============================================================
-- PetID Database Schema
-- PostgreSQL 16
-- 主键: UUID (推荐 UUIDv7 由应用生成)
-- 时间: TIMESTAMPTZ
-- ============================================================
-- ============================================================
-- 用户体系
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY,
    nickname VARCHAR(64),
    avatar TEXT,
    phone VARCHAR(20),
    email VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.avatar IS '头像 OSS Key';
CREATE TABLE user_auths (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(32) NOT NULL,
    open_id VARCHAR(128) NOT NULL,
    union_id VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider, open_id)
);
COMMENT ON TABLE user_auths IS '用户认证方式表（一个用户可绑定多个登录方式）';
COMMENT ON COLUMN user_auths.provider IS 'phone | email | wechat_miniprogram | wechat_mp';
COMMENT ON COLUMN user_auths.open_id IS '该方式下的唯一标识（手机号/邮箱/openid）';
COMMENT ON COLUMN user_auths.union_id IS '微信 unionid';
CREATE INDEX idx_user_auths_user_id ON user_auths(user_id);
CREATE INDEX idx_user_auths_union_id ON user_auths(union_id)
WHERE union_id IS NOT NULL;
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    app VARCHAR(32),
    device_type VARCHAR(32),
    device VARCHAR(128),
    os VARCHAR(32),
    os_version VARCHAR(32),
    ip VARCHAR(64),
    user_agent TEXT,
    status VARCHAR(16) NOT NULL DEFAULT 'active',
    last_active_at TIMESTAMPTZ,
    logged_out_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (status IN ('active', 'logged_out', 'kicked'))
);
COMMENT ON TABLE user_sessions IS '用户登录会话表';
COMMENT ON COLUMN user_sessions.id IS '写入 JWT 的 session_id';
COMMENT ON COLUMN user_sessions.device_type IS 'miniprogram | h5';
COMMENT ON COLUMN user_sessions.status IS 'active | logged_out | kicked';
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(user_id, status)
WHERE status = 'active';
-- ============================================================
-- 管理后台
-- ============================================================
CREATE TABLE admins (
    id UUID PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nickname VARCHAR(64),
    email VARCHAR(128),
    role VARCHAR(32) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        role IN ('super_admin', 'admin', 'operator', 'developer')
    )
);
COMMENT ON TABLE admins IS '管理员表';
COMMENT ON COLUMN admins.role IS 'super_admin | admin | operator | developer';
CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    app VARCHAR(32),
    device VARCHAR(128),
    os VARCHAR(32),
    os_version VARCHAR(32),
    ip VARCHAR(64),
    user_agent TEXT,
    status VARCHAR(16) NOT NULL DEFAULT 'active',
    last_active_at TIMESTAMPTZ,
    logged_out_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (status IN ('active', 'logged_out', 'kicked'))
);
COMMENT ON TABLE admin_sessions IS '管理员会话表';
COMMENT ON COLUMN admin_sessions.status IS 'active | logged_out | kicked';
CREATE INDEX idx_admin_sessions_admin_id ON admin_sessions(admin_id);
-- ============================================================
-- 设备体系
-- ============================================================
CREATE TABLE devices (
    id UUID PRIMARY KEY,
    sn VARCHAR(64) NOT NULL UNIQUE,
    model VARCHAR(64),
    batch VARCHAR(64),
    manufactured_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE devices IS '设备表（出厂录入）';
COMMENT ON COLUMN devices.sn IS '设备序列号（二维码内容）';
COMMENT ON COLUMN devices.model IS '设备型号';
COMMENT ON COLUMN devices.batch IS '生产批次';
COMMENT ON COLUMN devices.manufactured_at IS '生产时间';
COMMENT ON COLUMN devices.activated_at IS '首次绑定时间';
CREATE INDEX idx_devices_batch ON devices(batch)
WHERE batch IS NOT NULL;
CREATE TABLE user_devices (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    status VARCHAR(16) NOT NULL DEFAULT 'bound',
    bound_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    unbound_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (status IN ('bound', 'unbound'))
);
COMMENT ON TABLE user_devices IS '用户设备绑定表（用户扫码激活设备）';
COMMENT ON COLUMN user_devices.status IS 'bound | unbound';
CREATE UNIQUE INDEX idx_user_devices_active ON user_devices(device_id)
WHERE status = 'bound';
CREATE INDEX idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX idx_user_devices_device_id ON user_devices(device_id);
-- ============================================================
-- 宠物体系
-- ============================================================
CREATE TABLE pets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,
    avatar TEXT,
    gender VARCHAR(8),
    breed VARCHAR(64),
    description TEXT,
    contacts JSONB,
    contact_name VARCHAR(64),
    remark TEXT,
    images JSONB,
    status VARCHAR(16) NOT NULL DEFAULT 'normal',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (gender IN ('male', 'female', 'unknown')),
    CHECK (status IN ('normal', 'lost'))
);
COMMENT ON TABLE pets IS '宠物表';
COMMENT ON COLUMN pets.avatar IS '头像 OSS Key';
COMMENT ON COLUMN pets.gender IS 'male | female | unknown';
COMMENT ON COLUMN pets.breed IS '品种';
COMMENT ON COLUMN pets.contacts IS '联系方式 [{type, value, qr_key}]';
COMMENT ON COLUMN pets.contact_name IS '联系人姓名';
COMMENT ON COLUMN pets.images IS '宠物照片 OSS Key 数组';
COMMENT ON COLUMN pets.status IS 'normal | lost';
CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE TABLE pet_devices (
    id UUID PRIMARY KEY,
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    status VARCHAR(16) NOT NULL DEFAULT 'bound',
    bound_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    unbound_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (status IN ('bound', 'unbound'))
);
COMMENT ON TABLE pet_devices IS '宠物设备绑定表';
COMMENT ON COLUMN pet_devices.status IS 'bound | unbound';
CREATE UNIQUE INDEX idx_pet_devices_active ON pet_devices(device_id)
WHERE status = 'bound';
CREATE INDEX idx_pet_devices_pet_id ON pet_devices(pet_id);
CREATE INDEX idx_pet_devices_device_id ON pet_devices(device_id);
-- ============================================================
-- 宠物丢失事件
-- ============================================================
CREATE TABLE pet_lost_events (
    id UUID PRIMARY KEY,
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    lost_at TIMESTAMPTZ,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    country VARCHAR(64),
    province VARCHAR(64),
    city VARCHAR(64),
    address TEXT,
    description TEXT,
    status VARCHAR(16) NOT NULL DEFAULT 'lost',
    found_at TIMESTAMPTZ,
    found_remark TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (status IN ('lost', 'found'))
);
COMMENT ON TABLE pet_lost_events IS '宠物丢失事件表';
COMMENT ON COLUMN pet_lost_events.address IS '丢失地点描述';
COMMENT ON COLUMN pet_lost_events.status IS 'lost | found';
COMMENT ON COLUMN pet_lost_events.found_remark IS '找回备注';
CREATE INDEX idx_pet_lost_events_pet_id ON pet_lost_events(pet_id);
CREATE INDEX idx_pet_lost_events_status ON pet_lost_events(status)
WHERE status = 'lost';
CREATE INDEX idx_pet_lost_events_location ON pet_lost_events(latitude, longitude);
-- ============================================================
-- 扫码记录
-- ============================================================
CREATE TABLE scan_logs (
    id UUID PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    device_sn VARCHAR(64),
    ip INET,
    user_agent TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    accuracy INTEGER,
    country VARCHAR(64),
    province VARCHAR(64),
    city VARCHAR(64),
    address TEXT,
    poi_name VARCHAR(128),
    location_source VARCHAR(16),
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE scan_logs IS '扫码记录表';
COMMENT ON COLUMN scan_logs.device_sn IS '冗余设备序列号';
COMMENT ON COLUMN scan_logs.accuracy IS '定位精度（米）';
COMMENT ON COLUMN scan_logs.poi_name IS '附近地标名称';
COMMENT ON COLUMN scan_logs.location_source IS 'gps | ip';
CREATE INDEX idx_scan_logs_device_id ON scan_logs(device_id);
CREATE INDEX idx_scan_logs_scanned_at ON scan_logs(scanned_at);
CREATE INDEX idx_scan_logs_device_time ON scan_logs(device_id, scanned_at);