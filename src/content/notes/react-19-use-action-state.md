# React 19 升级指南：上手 `useActionState`

在 React 19 中，表单提交和异步操作迎来了一套更自然、更强大的机制：**Form Actions**。过去，我们需要手动创建 `isLoading`、`error` 等状态，并在提交时编写复杂的 `try-catch` 块。现在，有了全新的 `useActionState`，一切变得前所未有的简单。

## 什么是 Form Actions？

在 React 19 里，你可以直接将一个异步函数（Action）传给 `<form>` 的 `action` 属性：

```jsx
// 以前的做法
async function handleSubmit(e) {
  e.preventDefault();
  setIsLoading(true);
  await saveData(formData);
  setIsLoading(false);
}

// React 19 Actions 做法
async function saveAction(formData) {
  await saveData(formData);
}

<form action={saveAction}>
  <input name="name" />
  <button type="submit">保存</button>
</form>
```

当表单提交时，React 将自动为你处理：
1. **自动防抖/并发控制**：防止多次重复点击提交。
2. **挂起状态 (Pending State)**：自动将提交状态通过 Transitions 控制。

---

## 认识 `useActionState`

`useActionState` 接受一个 Action 函数并返回一个数组，分别是：**当前 State**、**包装后的 Action 触发器**、以及一个**是否正在提交的 boolean 标志 (isPending)**。

```typescript
import { useActionState } from 'react';

async function updateProfile(prevState: any, formData: FormData) {
  try {
    const response = await api.updateName(formData.get("username"));
    return { success: true, message: "更新成功！" };
  } catch (err) {
    return { success: false, message: "发生错误，请重试。" };
  }
}

function ProfileForm() {
  const [state, formAction, isPending] = useActionState(updateProfile, { success: false, message: "" });

  return (
    <form action={formAction}>
      <input type="text" name="username" required />
      <button type="submit" disabled={isPending}>
        {isPending ? '保存中...' : '保存修改'}
      </button>
      {state.message && <p className={state.success ? "success" : "error"}>{state.message}</p>}
    </form>
  );
}
```

### 为什么它如此好用？

- **无需手动拦截事件**：你不需要在事件处理器中写 `e.preventDefault()`。
- **状态渐进增强**：即便在 JavaScript 尚未加载完成或被禁用时，原生的 HTML `<form>` 提交动作依然能够工作（如果后端有对应路由）。
- **统一的 pending 控制**：`isPending` 可以在整个表单的所有嵌套组件中通过 `useFormStatus` 读取，这极大地简化了深层表单组件的设计。

希望这篇关于 React 19 的新特性分享能对你的前端开发工作有所启发！
