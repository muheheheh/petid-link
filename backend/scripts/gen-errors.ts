/**
 * 从 errors-client.json / errors-admin.json 分别生成对应的 errors ts 文件
 * 用法: bun run scripts/gen-errors.ts
 */

async function generate(inputFile: string, outputFile: string) {
  const modules = await Bun.file(inputFile).json();

  const lines: string[] = [
    `// ⚠️ 此文件由 scripts/gen-errors.ts 自动生成，请勿手动修改`,
    `// 源文件: ${inputFile}`,
    "",
    `import { defineErrors } from "@/errors";`,
    "",
    "const errors = defineErrors({",
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

  lines.push("} as const, {");
  lines.push(...msgEntries);
  lines.push("});");
  lines.push("");
  lines.push("export default errors;");
  lines.push("export const { ERR, errMsg, BizError } = errors;");
  lines.push("");

  await Bun.write(outputFile, lines.join("\n"));
  console.log(`✅ ${outputFile} generated`);
}

await generate("resources/errors-client.json", "src/errors/client.ts");
await generate("resources/errors-admin.json", "src/errors/admin.ts");
