import { useAuthStore } from '@/stores/auth';

export default function Workbench() {
  const { user } = useAuthStore();
  return (
    <div className="grid grid-cols-[240px_1fr] min-h-[calc(100vh-57px)]">
      <aside className="border-r bg-white p-4">
        <h3 className="text-xs font-medium text-slate-400 uppercase mb-3">导航</h3>
        <div className="space-y-1 text-sm">
          <div className="px-2 py-1.5 rounded bg-brand-50 text-brand font-medium">工作台</div>
          <div className="px-2 py-1.5 rounded text-slate-500 cursor-not-allowed">笔记</div>
          <div className="px-2 py-1.5 rounded text-slate-500 cursor-not-allowed">分类</div>
          <div className="px-2 py-1.5 rounded text-slate-500 cursor-not-allowed">标签</div>
          <div className="px-2 py-1.5 rounded text-slate-500 cursor-not-allowed">搜索</div>
          <div className="px-2 py-1.5 rounded text-slate-500 cursor-not-allowed">AI 问答</div>
          <div className="px-2 py-1.5 rounded text-slate-500 cursor-not-allowed">回收站</div>
        </div>
      </aside>
      <section className="p-6">
        <h2 className="text-xl font-semibold mb-2">
          你好，{user?.nickname} 👋
        </h2>
        <p className="text-slate-600 text-sm max-w-2xl leading-relaxed mb-6">
          欢迎使用个人知识库。登录注册模块已就位，笔记编辑、全文检索、AI 问答等功能将在后续模块中实现。
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {['笔记', '分类', '标签', '搜索', 'AI 问答', '回收站', '设置'].map((t) => (
            <div
              key={t}
              className="border rounded p-3 bg-white text-slate-400 hover:border-brand hover:text-brand transition-colors cursor-not-allowed"
            >
              {t}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
