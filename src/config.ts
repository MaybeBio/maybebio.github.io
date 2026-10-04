// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'Joe Hoye Dow | 计算生物学';
export const SITE_DESCRIPTION = 'Joe Hoye Dow 的个人主页：简历、项目与博客';
export const GENERATE_SLUG_FROM_TITLE = false
export const TRANSITION_API = true

// 背景音乐。文件放 public/music/ 下，这里写以 / 开头的 URL 路径。
// tracks 留空数组时，播放器整个不渲染。
// 浏览器不允许未静音自动播放，所以播放器默认是暂停的，点 ♪ 才开始。
export const BACKGROUND_MUSIC = {
    tracks: [
        { src: "/music/lullaby.mp3", title: "Lullaby" },
        { src: "/music/guitu-youfeng.mp3", title: "归途有风" },
        { src: "/music/baimeng-zhijian.mp3", title: "白梦之茧" },
        { src: "/music/luobi-yingfengyu.mp3", title: "落笔应风雨" },
    ],
    volume: 0.2,
    // 播放模式：'sequential'(顺序) | 'shuffle'(随机) | 'loop-one'(单曲循环)
    // 默认单曲循环；点 ♪ 里的播放键从第一首开始，循环这一首。
    mode: "loop-one",
};

export const BLOG_CATEGORIES = [
    { key: 'life', label: 'Life' },
    { key: 'paper', label: 'Paper' },
    { key: 'code', label: 'Code' },
]

export function categoryLabel(key: string) {
    return BLOG_CATEGORIES.find((c) => c.key === key)?.label ?? key
}