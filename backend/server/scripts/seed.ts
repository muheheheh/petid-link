import { Database } from "bun:sqlite";

const db = new Database("petid.db");

const now = Date.now();

const userId = "e2852288-cfdb-411e-ac69-d0dcf736f705";
const petId1 = "54bf85df-57ac-453c-82b9-15910a29dad0";
const petId2 = "5faf71d1-362d-44fe-9208-b666d8bf1644";
const deviceId1 = "5228b66f-8b05-48cb-9f15-cbe8aab070ff";
const deviceId2 = "648cafa1-8f7b-49d6-8401-8f69a2d9c0e3";
const authId = "a0c1d2e3-f4a5-4b6c-8d7e-9f0a1b2c3d4e";

// 清除旧的假数据
db.run(`DELETE FROM devices WHERE id IN (?, ?)`, [deviceId1, deviceId2]);
db.run(`DELETE FROM pets WHERE id IN (?, ?)`, [petId1, petId2]);
db.run(`DELETE FROM user_auths WHERE user_id = ?`, [userId]);
db.run(`DELETE FROM users WHERE id = ?`, [userId]);

// 用户
db.run(
  `INSERT INTO users (id, nickname, avatar, phone, email, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
  [userId, "张小明", null, "13800138000", "demo@petid.link", now]
);

// 用户认证
db.run(
  `INSERT INTO user_auths (id, user_id, provider, open_id, union_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
  [authId, userId, "wechat_miniprogram", "oXXXX_fake_openid_001", "unionid_fake_001", now]
);

// 宠物1 - 已绑定设备
db.run(
  `INSERT INTO pets (id, user_id, name, avatar, gender, breed, description, contacts, contact_name, remark, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [petId1, userId, "豆豆", null, "male", "金毛寻回犬", "性格温顺，喜欢玩球", JSON.stringify([{ type: "phone", value: "13800138000" }, { type: "wechat", value: "zhangxm_wx" }]), "张小明", "出门必带牵引绳", "normal", now]
);

// 宠物2 - 未绑定设备
db.run(
  `INSERT INTO pets (id, user_id, name, avatar, gender, breed, description, contacts, contact_name, remark, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [petId2, userId, "咪咪", null, "female", "英国短毛猫", "胆子小，怕生人", JSON.stringify([{ type: "phone", value: "13800138000" }]), "张小明", "室内猫，不常出门", "normal", now]
);

// 设备1 - 已激活+已绑定宠物1
db.run(
  `INSERT INTO devices (id, activation_code, user_id, pet_id, activated_at, bound_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [deviceId1, "A3K7NP2X", userId, petId1, now - 86400000, now - 3600000, now - 86400000 * 7]
);

// 设备2 - 已激活但未绑定宠物
db.run(
  `INSERT INTO devices (id, activation_code, user_id, pet_id, activated_at, bound_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [deviceId2, "B5M9QR4Y", userId, null, now - 3600000, null, now - 86400000 * 3]
);

console.log("✅ 假数据插入完成");
console.log(`  用户: ${userId} (张小明)`);
console.log(`  宠物: ${petId1} (豆豆 - 金毛), ${petId2} (咪咪 - 英短)`);
console.log(`  设备: ${deviceId1} (已绑定豆豆), ${deviceId2} (已激活未绑定)`);

// 将已有管理员设为超级管理员
db.run(`UPDATE admins SET role = 'super_admin' WHERE role = 'admin' OR role IS NULL`);
console.log("  管理员角色: 已将所有管理员设为 super_admin");

// 测试账号（密码统一 123456）
const testPassword = await Bun.password.hash("123456");
const testAdmins = [
  { id: "a0000001-0000-0000-0000-000000000001", username: "test_admin", nickname: "测试管理员", role: "admin" },
  { id: "a0000001-0000-0000-0000-000000000002", username: "test_operator", nickname: "测试运营", role: "operator" },
  { id: "a0000001-0000-0000-0000-000000000003", username: "test_developer", nickname: "测试开发", role: "developer" },
];

for (const a of testAdmins) {
  db.run(`DELETE FROM admin_sessions WHERE admin_id = ?`, [a.id]);
  db.run(`DELETE FROM admins WHERE id = ?`, [a.id]);
  db.run(
    `INSERT INTO admins (id, username, password_hash, nickname, role, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [a.id, a.username, testPassword, a.nickname, a.role, now]
  );
}
console.log("  测试账号: test_admin(管理员) / test_operator(运营) / test_developer(开发)，密码均为 123456");