export default function Workbench() {
  return (
    <div className="grid grid-cols-[240px_1fr] h-[calc(100vh-57px)]">
      <aside className="border-r bg-white p-4">
        <h3 className="text-xs font-medium text-slate-400 uppercase mb-3">分类</h3>
        <p className="text-sm text-slate-400">（分类树占位）</p>
      </aside>
      <section className="p-6">
        <h2 className="text-xl font-semibold mb-2">欢迎使用个人知识库</h2>
        <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
          这是前端骨架：已完成 Vite + React + TS + Tailwind 基础工程，
          路由、API Client、Zustand/TanStack Query、Milkdown 编辑器、SSE 流式问答、
          三栏布局等具体业务页面和功能将在后续编码节点实现。
          详见 <code className="px-1 bg-slate-100 rounded">docs/architecture.md</code>。
        </p>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {['笔记', '分类', '标签', '搜索', 'AI 问答', '回收站', '设置'].map((t) => (
            <div key={t} className="border rounded p-3 bg-white text-slate-600 hover:border-brand hover:text-brand transition-colors">
              {t}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
