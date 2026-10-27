import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";

function navClass(active: boolean) {
  return `block rounded-lg px-3 py-2 text-sm transition-colors ${
    active
      ? "bg-blue-600 font-medium text-white shadow-sm"
      : "text-gray-700 hover:bg-gray-200"
  }`;
}

export default function AdminLayout() {
  const { pathname } = useLocation();

  if (!localStorage.getItem("token")) return <Navigate to="/admin/login" replace />;

  // 编辑笔记时也归属「笔记列表」模块
  const isEditingNote =
    pathname.startsWith("/admin/notes/") && pathname !== "/admin/notes/new";

  return (
    <div className="flex min-h-screen">
      <aside className="w-48 shrink-0 space-y-2 bg-gray-100 p-4">
        <NavLink
          to="/admin/notes"
          end
          className={({ isActive }) => navClass(isActive || isEditingNote)}
        >
          笔记列表
        </NavLink>
        <NavLink to="/admin/messages" className={({ isActive }) => navClass(isActive)}>
          留言审核
        </NavLink>
        <NavLink
          to="/admin/notes/new"
          end
          className={({ isActive }) => navClass(isActive)}
        >
          发布笔记
        </NavLink>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("token");
            location.href = "/admin/login";
          }}
          className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-200"
        >
          退出
        </button>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
