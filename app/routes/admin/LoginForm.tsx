import { useState, type FormEvent } from "react";
import { AcUnit } from "~/components/decor/AcUnit/AcUnit";
import { LogoMark } from "~/components/layout/Logo/Logo";
import type { ApiError } from "~/lib/api";
import styles from "./LoginForm.module.scss";

type Props = {
  onSubmit: (email: string, password: string) => Promise<ApiError | null>;
};

type FieldErrors = {
  email?: string;
  password?: string;
};

/**
 * Вход в админку.
 *
 * На узком экране — тёмный экран целиком, кондиционер над формой, поля
 * стеклом поверх. На широком раскладка меняется на две панели: тёмная
 * колонка слева, светлая карточка справа.
 *
 * Тёмное здесь — та же «Глубина», что у шапки сайта: градиент графит →
 * индиго, сетка стены и тот же нарисованный кондиционер. Админка должна
 * ощущаться частью того же продукта, а не сторонней программой, куда
 * занесло по ссылке.
 *
 * Поля проверяются до отправки. Без этого пустая форма уходит на сервер,
 * возвращается «Неверная почта или пароль», и человек ищет опечатку там,
 * где её нет. Проверка на месте отвечает точнее и мгновенно.
 */
export function LoginForm({ onSubmit }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fields, setFields] = useState<FieldErrors>({});
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (!email.trim()) {
      errors.email = "Введите почту";
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      // Не полноценная проверка адреса — её не существует. Ловим опечатки
      // вроде пропущенной собаки, остальное отсеет сервер.
      errors.email = "Похоже на опечатку в адресе";
    }

    if (!password) errors.password = "Введите пароль";

    return errors;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const errors = validate();
    setFields(errors);
    if (Object.keys(errors).length > 0) return;

    setBusy(true);
    setError(await onSubmit(email.trim(), password));
    setBusy(false);
  }

  return (
    <div className={styles.page}>
      <aside className={styles.brand} aria-hidden>
        <span className={styles.mark}>
          <span className={styles.markChip}>
            <LogoMark className={styles.markLogo} />
          </span>
          Климат Лайн
        </span>

        <div className={styles.brandBody}>
          <AcUnit className={styles.unit} />
          <p className={styles.brandTitle}>Панель управления сайтом</p>
          <p className={styles.brandText}>
            Заявки, цены на монтаж, товары, отзывы и фотографии работ. Правки
            видны на сайте после пересборки.
          </p>
        </div>

        <span className={styles.brandFoot}>Внутренний инструмент</span>
      </aside>

      <div className={styles.formSide}>
        {/* Кондиционер на узком экране: тёмной колонки там нет, и форма
            осталась бы одна на пустом фоне. На широком он прячется —
            в левой половине уже стоит такой же. */}
        <AcUnit className={styles.unitMobile} />

        <form onSubmit={submit} className={styles.card} noValidate>
          <span className={styles.mobileMark}>
            <span className={styles.markChip}>
              <LogoMark className={styles.markLogo} />
            </span>
            Климат Лайн
          </span>

          <h1 className={styles.title}>Вход</h1>
          <p className={styles.subtitle}>
            Почта и пароль, которые заведены в Supabase.
          </p>

          <div className={styles.fields}>
            <label className={styles.field}>
              <span className={styles.label}>Почта</span>
              <input
                className={styles.input}
                type="email"
                autoComplete="username"
                // Курсор сразу в первом поле: на странице входа больше
                // делать нечего, и лишний клик здесь ничем не оправдан.
                autoFocus
                aria-invalid={!!fields.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {fields.email && (
                <span className={styles.fieldError}>{fields.email}</span>
              )}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Пароль</span>
              <input
                className={styles.input}
                type="password"
                autoComplete="current-password"
                aria-invalid={!!fields.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {fields.password && (
                <span className={styles.fieldError}>{fields.password}</span>
              )}
            </label>
          </div>

          {error && (
            <p className={styles.alert} role="alert">
              {error.message}
            </p>
          )}

          <button type="submit" className={styles.submit} disabled={busy}>
            {busy ? "Вхожу…" : "Войти"}
          </button>

          <p className={styles.note}>
            Забыли пароль — его меняют в панели Supabase: Authentication → Users
            → три точки у нужной строки → Reset password.
          </p>
        </form>
      </div>
    </div>
  );
}
