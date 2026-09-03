import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { Button } from "~/components/ui/Button/Button";
import { leadSchema, formatPhone, type LeadInput } from "~/lib/lead-schema";
import { site } from "~/config/site";
import styles from "./LeadForm.module.scss";

type Props = {
  source: LeadInput["source"];
  productSlug?: string;
  /** Подставляется в сообщение — например, площадь со страницы решения. */
  defaultMessage?: string;
};

type Status = "idle" | "sending" | "sent" | "error";

export function LeadForm({ source, productSlug, defaultMessage }: Props) {
  const [status, setStatus] = useState<Status>("idle");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      source,
      productSlug,
      message: defaultMessage ?? "",
      phone: "",
    },
  });

  async function onSubmit(values: LeadInput) {
    setStatus("sending");
    try {
      // TODO: эндпоинт появится на этапе 4 вместе с serverless-функцией.
      // Пока запрос уходит в никуда и честно показывает ошибку с телефоном —
      // молча «принимать» заявку нельзя, так теряются клиенты.
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className={styles.done}>
        <b className={styles.doneTitle}>Заявка принята</b>
        <p>Перезвоню в ближайшее время. Обычно это занимает пару часов.</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Как вас зовут</span>
          <input
            className={styles.input}
            type="text"
            autoComplete="name"
            placeholder="Иван"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          {errors.name && <span className={styles.error}>{errors.name.message}</span>}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Телефон</span>
          <input
            className={styles.input}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+375 (29) 123-45-67"
            aria-invalid={!!errors.phone}
            {...register("phone", {
              onChange: (e) =>
                setValue("phone", formatPhone(e.target.value), {
                  shouldValidate: false,
                }),
            })}
          />
          {errors.phone && (
            <span className={styles.error}>{errors.phone.message}</span>
          )}
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>
          Комментарий <span className={styles.optional}>— необязательно</span>
        </span>
        <textarea
          className={styles.textarea}
          rows={3}
          placeholder="Площадь помещения, этаж, пожелания по модели"
          {...register("message")}
        />
      </label>

      {/* Honeypot: человек его не видит, бот заполняет — заявка отсеивается. */}
      <input
        className={styles.honeypot}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        {...register("company")}
      />

      <label className={styles.consent}>
        <input type="checkbox" {...register("consent")} />
        <span>
          Согласен на обработку персональных данных и с{" "}
          <Link to="/privacy">политикой конфиденциальности</Link>
        </span>
      </label>
      {errors.consent && (
        <span className={styles.error}>{errors.consent.message}</span>
      )}

      <div className={styles.actions}>
        <Button type="submit" size="lg" disabled={status === "sending"}>
          {status === "sending" ? "Отправляю…" : "Отправить заявку"}
        </Button>
        <span className={styles.note}>
          Или позвоните: <a href={site.phoneHref}>{site.phone}</a>
        </span>
      </div>

      {status === "error" && (
        <p className={styles.error}>
          Не удалось отправить заявку. Позвоните мне напрямую:{" "}
          <a href={site.phoneHref}>{site.phone}</a>
        </p>
      )}
    </form>
  );
}
