import { z, defineCollection } from "astro:content";
import { BLOG_CATEGORIES } from "../config";

const categoryKeys = BLOG_CATEGORIES.map((c) => c.key) as [string, ...string[]];

const blogSchema = z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    category: z.enum(categoryKeys),
    updatedDate: z.string().optional(),
    heroImage: z.string().optional(),
    badge: z.string().optional(),
    tags: z.array(z.string()).refine(items => new Set(items).size === items.length, {
        message: 'tags must be unique',
    }).optional(),
});

export type BlogSchema = z.infer<typeof blogSchema>;

const blogCollection = defineCollection({ schema: blogSchema });

export const collections = {
    'blog': blogCollection,
}
