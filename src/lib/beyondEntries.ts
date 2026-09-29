import { getCollection } from "astro:content";

// 列表标题取原始文件名（保留大小写，如 ACGN.md -> "ACGN"）；
// URL 仍用 Astro 生成的小写 slug（/beyond/acgn）。
export async function getBeyondEntries() {
  const entries = await getCollection("beyond");

  return entries
    .map((entry) => ({
      ...entry,
      title: entry.id.split("/").pop()!.replace(/\.[^.]+$/, ""),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}
