import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, type MetaFunction } from "react-router";
import {
  ExternalLink,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Star,
  Wallet,
  X,
} from "lucide-react";
import {
  currentUser,
  onAuthChange,
  signIn,
  signOut,
  type User,
} from "~/lib/admin-api";
import { AuthContext, type AuthValue } from "~/hooks/authContext";
import { LogoMark } from "~/components/layout/Logo/Logo";
import { Publish } from "~/components/admin/Publish";
import { MobileMenu, type Section } from "~/components/admin/MobileMenu";
import { LoginForm } from "./LoginForm";
import type { ApiError } from "~/lib/api";
import styles from "./layout.module.scss";

/**
 * Админка внутри сайта.
 *
 * Отдельным приложением она уже была, и от этого пришлось отказаться:
 * модель данных начала дублироваться — типы товара, названия категорий,
 * подписи источников заявок. Копии совпадали ровно до первого изменения,
 * а расходились бы молча, потому что оба проекта собирались успешно.
 * Здесь всё это берётся из `~/types/product` и `~/lib/admin-api`.
 *
 * Роут не пререндерится (см. react-router.config.ts) и закрыт в robots.txt.
 * Защита при этом не в адресе, а в пароле Supabase и в RLS: анонимный ключ
 * публичен по замыслу и без вошедшего пользователя не даёт ничего.
 *
 * Форма входа — состояние этого макета, а не отдельный роут. Так проще:
 * не нужно ни редиректов, ни проверки «а не на логине ли мы уже».
 */

export const meta: MetaFunction = () => [
  { title: "Админка — Климат Лайн" },
  { name: "robots", content: "noindex, nofollow" },
];

/**
 * Разделы в порядке частоты обращения, а не по алфавиту и не по важности
 * данных. Заявки открывают каждый день, работы — раз в месяц; список,
 * отсортированный «по логике предметной области», заставлял бы ежедневное
 * действие искать глазами среди редких.
 */
const SECTIONS: Section[] = [
  { to: "/admin", label: "Главная", icon: LayoutDashboard, end: true },
  { to: "/admin/leads", label: "Заявки", icon: Inbox },
  { to: "/admin/prices", label: "Цены", icon: Wallet },
  { to: "/admin/products", label: "Товары", icon: Package },
  { to: "/admin/reviews", label: "Отзывы", icon: Star },
  { to: "/admin/portfolio", label: "Работы", icon: Images },
];

const ROLES: Record<User["role"], string> = {
  owner: "Владелец",
  dev: "Разработчик",
};

/**
 * Вкладка нижней панели. Общая для обеих половин — они отличаются только
 * тем, какие разделы в них попали.
 */
function renderTab({ to, label, icon: Icon, end }: Section) {
  return (
    <NavLink
      key={to}
      to={to}
      end={end}
      className={({ isActive }) =>
        isActive ? `${styles.tab} ${styles.tabOn}` : styles.tab
      }
    >
      <Icon aria-hidden />
      {label}
    </NavLink>
  );
}

export default function AdminLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const check = useCallback(async () => {
    const result = await currentUser();
    if (result.error) {
      setError(result.error);
      setUser(null);
    } else {
      setUser(result.data);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void check();
    // Вход и выход в соседней вкладке: без подписки одна остаётся
    // «вошедшей», и первое действие в ней падает на правах.
    return onAuthChange(() => void check());
  }, [check]);

  const value: AuthValue = {
    user,
    loading,
    error,
    async signIn(email, password) {
      const result = await signIn(email, password);
      if (result.error) return result.error;
      setUser(result.data);
      setError(null);
      return null;
    },
    async signOut() {
      await signOut();
      setUser(null);
    },
  };

  // Пока сохранённая сессия не проверена, показывать форму нельзя:
  // человека выбрасывало бы на вход при каждом обновлении страницы.
  if (loading) {
    return <p className={styles.splash}>Загружаю…</p>;
  }

  // Сессия есть, а профиля нет. На форму входа возвращать бессмысленно —
  // он её уже прошёл; говорим, что именно не так.
  if (error && error.code === "auth/no-profile") {
    return (
      <p className={styles.splash} role="alert">
        {error.message}
      </p>
    );
  }

  if (!user) return <LoginForm onSubmit={value.signIn} />;

  return (
    <AuthContext value={value}>
      <div className={styles.shell}>
        <aside className={styles.side}>
          <span className={styles.brand}>
            {/* Эмблема на светлом кружке: буква в знаке тёмно-синяя,
                и на градиенте панели она пропала бы совсем. */}
            <span className={styles.brandMark}>
              <LogoMark className={styles.brandLogo} />
            </span>

            <span className={styles.brandText}>
              <span className={styles.brandName}>Климат Лайн</span>
              <span className={styles.brandNote}>Панель управления</span>
            </span>
          </span>

          <nav className={styles.nav}>
            {SECTIONS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  isActive ? `${styles.link} ${styles.active}` : styles.link
                }
              >
                <Icon aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Публикация — над подписью пользователя: это последнее
              действие в работе, и место у нижнего края ему подходит.
              На телефоне от блока остаётся одна кнопка. */}
          <div className={styles.publish}>
            <Publish />
          </div>

          <div className={styles.foot}>
            <span className={styles.avatar} aria-hidden>
              {user.name.trim().charAt(0).toUpperCase() || "?"}
            </span>

            <span className={styles.who}>
              <span className={styles.name}>{user.name}</span>
              <span className={styles.role}>{ROLES[user.role]}</span>
            </span>

            {/* Ссылка на сайт: проверить правку — обычное следующее
                действие, а искать вкладку с сайтом руками незачем. */}
            <a
              className={styles.sideAction}
              href="/"
              target="_blank"
              rel="noreferrer"
              title="Открыть сайт в новой вкладке"
              aria-label="Открыть сайт в новой вкладке"
            >
              <ExternalLink aria-hidden />
            </a>

            <button
              type="button"
              className={`${styles.sideAction} ${styles.exit}`}
              onClick={() => void value.signOut()}
              title="Выйти"
              aria-label="Выйти"
            >
              <LogOut aria-hidden />
            </button>
          </div>
        </aside>

        <main className={styles.main}>
          <Outlet />
        </main>

        {/*
          Нижняя панель телефона: четыре раздела и кнопка меню посередине.

          Шесть разделов в полосу шириной с телефон не встают — на узком
          экране на вкладку остаётся около сорока точек, и подписи начинают
          обрезаться. Здесь четыре самых частых, а середина открывает то же
          меню целиком, вместе с публикацией и выходом.
        */}
        <nav className={styles.bar} aria-label="Разделы админки">
          {SECTIONS.slice(0, 2).map(renderTab)}

          <button
            type="button"
            className={
              menuOpen ? `${styles.menuButton} ${styles.menuOn}` : styles.menuButton
            }
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X aria-hidden /> : <Menu aria-hidden />}
          </button>

          {SECTIONS.slice(2, 4).map(renderTab)}
        </nav>

        <MobileMenu
          open={menuOpen}
          sections={SECTIONS}
          user={{ name: user.name, role: ROLES[user.role] }}
          onClose={() => setMenuOpen(false)}
          onSignOut={() => {
            setMenuOpen(false);
            void value.signOut();
          }}
        />
      </div>
    </AuthContext>
  );
}
