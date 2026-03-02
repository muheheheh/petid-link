/**
 * 从 errors.json 生成 src/errors.ts
 * 用法: bun run scripts/gen-errors.ts
 */

const modules = await Bun.file("errors.json").json();

// 收集所有语言
const langs = new Set<string>();
for (const mod of modules) {
  for (const err of mod.errors) {
    for (const lang of Object.keys(err.message)) {
      langs.add(lang);
    }
  }
}
const langUnion = [...langs].map((l) => `"${l}"`).join(" | ");

const lines: string[] = [
  "// ⚠️ 此文件由 scripts/gen-errors.ts 自动生成，请勿手动修改",
  "// 源文件: errors.json",
  "",
  "export type ErrCode = (typeof ERR)[keyof typeof ERR];",
  `export type Lang = ${langUnion};`,
  "",
  "export const ERR = {",
];

const msgEntries: string[] = [];

for (const mod of modules) {
  for (const err of mod.errors) {
    const fullKey = `${mod.module}_${err.key}`;
    lines.push(`  /** ${err.desc} */`);
    lines.push(`  ${fullKey}: ${err.code},`);
    const msgParts = Object.entries(err.message)
      .map(([lang, text]) => `"${lang}": ${JSON.stringify(text)}`)
      .join(", ");
    msgEntries.push(`  [${err.code}]: { ${msgParts} },`);
  }
}

lines.push("} as const;");
lines.push("");
lines.push("const messages: Record<number, Record<Lang, string>> = {");
lines.push(...msgEntries);
lines.push("};");
lines.push("");
lines.push("export function errMsg(code: ErrCode, lang: Lang = \"zh-Hans\"): string {");
lines.push(`  return messages[code]?.[lang] ?? messages[${modules[0].errors[0].code}]?.[lang] ?? "Unknown error";`);
lines.push("}");
lines.push("");
lines.push("// 业务异常");
lines.push("export class BizError extends Error {");
lines.push("  code: ErrCode;");
lines.push("  constructor(code: ErrCode, message?: string) {");
lines.push("    super(message ?? errMsg(code));");
lines.push("    this.code = code;");
lines.push("  }");
lines.push("}");
lines.push("");

await Bun.write("src/errors.ts", lines.join("\n"));
console.log("✅ src/errors.ts generated");
