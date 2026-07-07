# 网格美学：CSS Grid 在现代网页排版中的创意实践

在以往的 Web 布局中，Flexbox 是我们的主力军。然而，当需要创建二维的、非对称的或者极富个性的艺术排版时，CSS Grid 才是真正的降维打击。

本文将探讨如何利用 CSS Grid 打破千篇一律的卡片排列，设计出一个充满个性的网格布局。

## 1. 突破常规的不对称排版

传统的 Grid 布局通常是 `grid-template-columns: repeat(3, 1fr)` 的等分样式。我们可以通过不对称的比例与跨列（`grid-column`）让布局充满动感：

```css
.creative-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  grid-gap: 20px;
}

.item-hero {
  grid-column: span 2;
  grid-row: span 2;
  background-color: var(--accent);
  color: white;
}
```

如此一来，首个主卡片将占据 2/3 的宽度，并自动向下跨越两行，这极适合用来作个人博客的头条或精选项目的展示。

---

## 2. 卡片重叠与三维层叠 (Z-Index)

Grid 的另一个强大特性是允许子元素位于同一个单元格（cell）内，通过 CSS `grid-area` 和 `z-index` 实现视觉重叠：

```css
.card-container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  align-items: center;
}

.card-image {
  grid-column: 1 / 8;
  z-index: 1;
}

.card-content {
  grid-column: 6 / 13;
  z-index: 2;
  background: var(--bg);
  border: 2px solid var(--border);
  padding: 24px;
}
```

通过指定交叠的列索引（图片占第 1 到 7 列，文本内容占第 6 到 12 列），我们实现了一个现代画廊感十足的重叠卡片。

---

## 3. 自适应轨道（Minmax 与 Auto-Fill）

在实现响应式布局时，尽量避免使用繁杂的 `@media` 查询来修改网格列数。相反，使用 `auto-fill` 或 `auto-fit` 搭配 `minmax()`：

```css
.grid-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
```

这句简短的代码意味着，当屏幕宽度足够时，会自动塞下尽可能多的卡片；当屏幕变窄，卡片宽度低于 280px 时，会自动换行并重新拉伸填满整个可用空间。

通过组合这些实用的 Grid 特性，你就能创造出充满个性、呼吸感强的先锋派网格网页，彻底告别平庸的模板风格。
