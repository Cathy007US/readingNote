import { NavLink, Outlet } from "react-router-dom";
import { useI18n } from "../i18n";

export default function Layout() {
  const { t, lang, toggleLang } = useI18n();

  const menus = [
    { to: "/", label: t("home"), end: true },
    { to: "/messages", label: t("messages"), end: false },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line bg-paper/90 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-xl font-bold tracking-wide text-accent">
              {t("siteName")}
            </h1>
            <p className="text-xs text-ink/60">{t("subtitle")}</p>
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

            <button
              type="button"
              onClick={toggleLang}
              className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink/70 transition-colors hover:bg-accent-soft hover:text-accent"
            >
              <span className={lang === "zh" ? "text-accent" : ""}>中</span>
              <span className="text-ink/30">/</span>
              <span className={lang === "en" ? "text-accent" : ""}>EN</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-line py-6 text-center text-xs text-ink/50">
        {t("footer")}
      </footer>
    </div>
  );
}
