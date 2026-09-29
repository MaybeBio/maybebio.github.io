import { getCollection } from "astro:content";
import { BLOG_CATEGORIES } from "../config";

const categoryKeys = BLOG_CATEGORIES.map((c) => c.key);

// 分区由子文件夹决定：src/content/blog/<category>/<file>.md
export async function getBlogPosts() {
  const posts = await getCollection("blog");

  return posts
    .map((post) => {
      const category = post.slug.split("/")[0];

      if (!categoryKeys.includes(category)) {
        throw new Error(
          `[blog] "${post.id}" 必须放在分区子文件夹里。合法分区: ${categoryKeys.join(
            ", "
          )}（例如 src/content/blog/life/xxx.md）`
        );
      }

      return { ...post, category };
    })
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
