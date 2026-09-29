// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'Joe Hoye Dow | 计算生物学';
export const SITE_DESCRIPTION = 'Joe Hoye Dow 的个人主页：简历、项目与博客';
export const GENERATE_SLUG_FROM_TITLE = false
export const TRANSITION_API = true

export const BLOG_CATEGORIES = [
    { key: 'life', label: 'Life' },
    { key: 'paper', label: 'Paper' },
    { key: 'code', label: 'Code' },
]

export function categoryLabel(key: string) {
    return BLOG_CATEGORIES.find((c) => c.key === key)?.label ?? key
}