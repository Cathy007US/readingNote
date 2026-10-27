import { NavLink, Outlet } from "react-router-dom";

export default function Layout() {
  const menus = [
    { to: "/", label: "首页", end: true },
    { to: "/messages", label: "留言", end: false },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line bg-paper/90 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-xl font-bold tracking-wide text-accent">
              Reading Notes
            </h1>
            <p className="text-xs text-ink/60">读书笔记 · 思想沉淀</p>
          </div>

          <div className="flex items-center gap-3">
            <nav className="flex gap-1">
              {menus.map((m) => (
                <NavLink
                  key={m.to}
                  to={m.to}
                  end={m.end}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-full text-sm transition-colors ${
                      isActive
                        ? "bg-accent text-white"
                        : "text-ink/70 hover:bg-accent-soft"
                    }`
                  }
                >
                  {m.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-line py-6 text-center text-xs text-ink/50">
        读到的，想到的，都值得记下来。
        <p className="mt-2">© {new Date().getFullYear()} Reading Notes · What you read and think is worth recording.</p>
      </footer>
    </div>
  );
}
