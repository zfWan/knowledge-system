export default function Login() {
  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">登录</h2>
      <p className="text-sm text-slate-500 mb-4">
        前端骨架页面。正式登录表单将在后续编码节点实现，接口对接
        <code className="mx-1 px-1 bg-slate-100 rounded">POST /api/auth/login</code>。
      </p>
      <form className="space-y-3">
        <input type="email" placeholder="邮箱" className="w-full border rounded px-3 py-2 text-sm" disabled />
        <input type="password" placeholder="密码" className="w-full border rounded px-3 py-2 text-sm" disabled />
        <button type="button" className="w-full bg-brand text-white rounded py-2 text-sm opacity-60 cursor-not-allowed" disabled>
          登录（待实现）
        </button>
      </form>
    </div>
  );
}
