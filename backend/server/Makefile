.PHONY: dev start db-generate db-migrate db-studio gen-errors

# 开发模式（热重载）
dev:
	bun run --hot src/index.ts

# 生产启动
start:
	bun run src/index.ts

# 生成数据库迁移文件
db-generate:
	bunx drizzle-kit generate

# 执行迁移
db-migrate:
	bunx drizzle-kit migrate

# 打开 Drizzle Studio
db-studio:
	bunx drizzle-kit studio

# 从 errors.json 生成错误码
gen-errors:
	bun run scripts/gen-errors.ts
