# Vite 性能优化实战：大幅提升打包与热更新速度

作为一个极速的前端构建工具，Vite 已经在大多数项目里成为了首选。然而，当项目规模增长到包含成百上千个模块时，冷启动、打包时间（Vite Build）以及热更新（HMR）依旧会面临一定的挑战。本文总结了一些在实战中成效显著的 Vite 性能优化手段。

## 1. 深度优化预构建（Dependency Pre-Bundling）

Vite 在启动开发服务器时会预构建 `node_modules` 里的第三方依赖，以将 CommonJS/UMD 依赖转换为 ESM，并减少请求数。

如果你的项目中有许多按需加载的库（比如复杂的图表库、大体积的组件库），Vite 可能在开发过程中因为检测到新依赖而频繁重新构建（造成多次页面重新刷新）。

你可以通过在 `vite.config.ts` 中手动显式配置 `optimizeDeps.include` 和 `optimizeDeps.exclude` 来避免此问题：

```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'lodash-es',
      'apexcharts'
    ]
  }
})
```

---

## 2. 巧用代码拆分与 Rollup 优化

默认情况下，Rollup 会将公共代码合并到几个大文件中。通过细化 `manualChunks` 配置，我们可以将稳定的第三方库单独打包，配合浏览器缓存策略极大提升二次加载速度：

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('lodash')) return 'vendor-lodash';
            return 'vendor-others';
          }
        }
      }
    }
  }
})
```

---

## 3. 关闭不必要的 Source Map

在开发调试中 Source Map 非常重要，但在生产构建时，生成 Source Map 会显著增加打包时间并增大部署体积。除非有生产监控（如 Sentry）的特殊要求，否则建议在打包时关闭 Source Map：

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: false, // 设为 false 可大幅减少打包开销
  }
})
```

---

## 4. 替换更高效的编译工具

如果你的打包瓶颈在压缩（Minification）上，Vite 默认使用的 Esbuild 已经是业界翘楚。如果追求更极致的 CSS 解析，可以使用 LightningCSS 替换原生的 CSS 解析流程：

```typescript
// vite.config.ts
export default defineConfig({
  css: {
    transformer: 'lightningcss',
  },
  build: {
    cssMinify: 'lightningcss'
  }
})
```

通过以上组合拳，一个中大型项目的构建时间通常能被缩短 30% 到 50%，开发热更新也能够维持在亚秒级的响应速度。
