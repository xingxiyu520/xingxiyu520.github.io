# 内容编辑指南

这个项目已经把“内容数据”和“页面组件”分开：

- `src/data/config.ts`：首页主问候、联系方式、项目列表。
- `src/data/siteContent.ts`：首页小组件、导航、筛选项、推荐资源、友链、About、文章详情示例、Avatar 页文案。
- `src/data/notes.ts`：文章列表元信息，包括标题、摘要、日期、标签。
- `src/App.tsx`：页面结构和交互逻辑。日常改文字或增删卡片通常不用改这里。
- `src/App.css`：布局、颜色、卡片、动效、响应式样式。

## 修改 GitHub 资料和头像

打开 `src/data/config.ts`，修改 `portfolioConfig.profile`：

```ts
profile: {
  name: "XiyuFeather",
  githubLogin: "xingxiyu520",
  avatarUrl: "https://avatars.githubusercontent.com/u/184849289?v=4",
  publicRepos: 8,
  followers: 2,
  following: 3,
  githubCreatedAt: "2024-10-13",
}
```

首页侧栏、首页主头像、About 页面和文章作者区都会读取这里的 `avatarUrl`。

## 修改首页主问候

打开 `src/data/config.ts`，修改 `portfolioConfig.hero`：

```ts
hero: {
  headingAccent: "辛熙羽",
}
```

首页中间只显示按时间自动生成的问候，例如“下午好，我是辛熙羽”。这里的 `headingAccent` 是首页显示的名字。详细个人介绍不要放首页，去 `src/data/siteContent.ts` 的 `aboutContent` 修改。

## 添加项目

打开 `src/data/config.ts`，在 `portfolioConfig.projects` 数组里追加一项：

```ts
{
  name: {
    zh: "项目中文名",
    en: "Project English Name",
  },
  desc: {
    zh: "项目中文简介",
    en: "Project English description.",
  },
  tags: ["React", "TypeScript", "AI"],
  icon: "UI",
  website: "https://your-project-site.example.com",
  github: "https://github.com/your-name/your-project",
}
```

项目页会自动读取这里的数据。首页“我的项目”小组件也会从这里轮播。项目卡片里的图标、`Website / GitHub` 链接也读取这里。

## 添加文章

站内文章打开 `src/data/notes.ts`，在 `notesMetadata` 数组里追加：

```ts
{
  slug: "my-new-note",
  title: {
    zh: "文章标题",
    en: "Article Title",
  },
  summary: {
    zh: "文章摘要",
    en: "Article summary.",
  },
  date: "2026-07-07",
  tags: ["React", "Wiki"],
}
```

首页近期文章会自动轮播这里的文章元信息。Blog 归档里的固定展示数据在 `src/data/siteContent.ts` 的 `archiveGroups`。

## 添加外链文章

外站文章不要放到 `notes.ts`。打开 `src/data/siteContent.ts`，在 `resources` 数组里追加一项，并把 `category` 写成 `"文章"`：

```ts
{
  title: "外链文章标题",
  url: "juejin.cn/post/xxx",
  href: "https://juejin.cn/post/xxx",
  category: "文章",
  desc: "这篇外站文章的简介。",
  views: "1.2k",
  marks: "68",
  icon: "external",
}
```

`url` 是卡片上显示的短链接文字，`href` 是点击后真正打开的完整链接。

推荐分享页顶部分类会自动从 `resources` 的 `category` 生成。你只需要给每张卡片填好 `category`，不用再单独维护分类按钮。

## 修改首页文案和小组件

打开 `src/data/siteContent.ts`：

- `homeContent`：首页站点名、欢迎语、社交入口标题、组件标题。
- `homeMenuItems`：左侧导航菜单。
- `homeRecommendations`：今日推荐轮播内容。
- `homeGalleryPhotos`：首页顶部图片卡片点击后弹出的相册照片。
- `homeTracks`：音乐播放器曲目。
- `socialLinks`：社交按钮。

首页最上方图片卡片本身不显示文字，点击后会打开一屏散落照片墙；再点击某张照片，会进入单张大图查看。添加照片时，把图片放到 `public/images/gallery/`，然后在 `src/data/siteContent.ts` 的 `homeGalleryPhotos` 里追加：

```ts
{
  title: "照片标题",
  caption: "照片说明",
  src: "/images/gallery/my-photo.png",
  alt: "照片替代文本",
}
```

音乐播放器支持真实音频文件。把音乐文件放到 `public/music/`，然后在 `src/data/siteContent.ts` 的 `homeTracks` 里填写：

```ts
{
  title: "歌曲名",
  artist: "作者或歌手",
  src: "/music/song.mp3",
  duration: 180,
}
```

`src` 为空时，播放器会使用内置的轻量预览音，方便没有准备音乐文件时测试播放、暂停、切歌和进度条。

## 修改其他页面内容

同样在 `src/data/siteContent.ts`：

- `pageHeroes`：Blog、Projects、Share、Bloggers 页面顶部标题区。
- `aboutContent`：About 页面正文。
- `resources`：Share 推荐资源卡片，包括外链文章。
- `friendLinks`：Bloggers 友链卡片。
- `articleDetailContent`：Article Detail 示例文章内容和右侧目录。
- `avatarContent`：Avatar / Live2D 页面文案。

## 修改样式和布局

打开 `src/App.css`。这里负责粉蓝白配色、玻璃卡片、Bento 布局、时钟样式、页面切换动画和移动端适配。
