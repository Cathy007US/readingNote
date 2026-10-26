import { Navigate, Outlet, Link } from "react-router-dom";

export default function AdminLayout() {
  if (!localStorage.getItem("token")) return <Navigate to="/admin/login" replace />;
  return (
    <div className="flex min-h-screen">
      <aside className="w-48 bg-gray-100 p-4 space-y-2">
        <Link to="/admin/notes" className="block">笔记列表</Link>
        <Link to="/admin/messages" className="block">留言列表</Link>
        <Link to="/admin/notes/new" className="block">发布笔记</Link>
        <button onClick={() => { localStorage.removeItem("token"); location.href = "/admin/login"; }}>退出</button>
      </aside>
      <main className="flex-1 p-6"><Outlet /></main>
    </div>
  );
}