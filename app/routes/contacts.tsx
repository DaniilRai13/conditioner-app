import type { MetaFunction } from "react-router";
import { Phone, Clock, MapPin, Send } from "lucide-react";
import { PageHeader } from "~/components/layout/PageHeader";
import { Section } from "~/components/ui/Section";
import { Card } from "~/components/ui/Card";
import { LeadForm } from "~/components/forms/LeadForm";
import { coverage } from "~/data/about";
import { site } from "~/config/site";
import styles from "./contacts.module.scss";

export const meta: MetaFunction = () => [
  { title: `Контакты — ${site.name}` },
  {
    name: "description",
    content: `Телефон, мессенджеры и часы работы. Установка и обслуживание кондиционеров в ${site.region}.`,
  },
];

// Основная разметка организации живёт здесь — на странице контактов,
// где собраны все данные о бизнесе (PLAN.md §9).
const localBusiness = {
  "@context": "https://schema.org",
  "@type": "HVACBusiness",
  name: site.name,
  description: `Продажа, установка и обслуживание кондиционеров в ${site.region}`,
  telephone: site.phone,
  areaServed: site.region,
  address: {
    "@type": "PostalAddress",
    addressLocality: site.city,
    addressCountry: "BY",
  },
  url: site.url,
};

export default function Contacts() {
  return (
    <main>
      <PageHeader
        title="Контакты"
        lead="Звоните или пишите в мессенджер — отвечаю лично. Консультация и расчёт стоимости бесплатны."
        crumbs={[{ label: "Контакты" }]}
      />

      <Section className={styles.top}>
        <div className={styles.grid}>
          <div className={styles.cards}>
            <Card className={styles.card}>
              <span className={styles.label}>
                <Phone size={18} aria-hidden /> Телефон
              </span>
              <a className={styles.value} href={site.phoneHref}>
                {site.phone}
              </a>
              <span className={styles.hint}>Звонки и мессенджеры</span>
            </Card>

            <Card className={styles.card}>
              <span className={styles.label}>
                <Clock size={18} aria-hidden /> Часы работы
              </span>
              <span className={styles.value}>{site.workHours}</span>
              <span className={styles.hint}>
                В сезон отвечаю и позже — пишите в любое время
              </span>
            </Card>

            <Card className={styles.card}>
              <span className={styles.label}>
                <MapPin size={18} aria-hidden /> Зона выезда
              </span>
              <span className={styles.value}>{site.region}</span>
              <ul className={styles.coverage}>
                {coverage.map((place) => (
                  <li key={place}>{place}</li>
                ))}
              </ul>
              <span className={styles.hint}>
                Выезд за МКАД обсуждается отдельно — расстояние влияет на стоимость
              </span>
            </Card>

            <Card className={styles.card}>
              <span className={styles.label}>
                <Send size={18} aria-hidden /> Мессенджеры
              </span>
              {/* TODO: заглушка — ссылки на Telegram, Viber и WhatsApp
                  добавим, когда заказчик передаст аккаунты (PLAN.md §11). */}
              <span className={styles.value}>Telegram · Viber · WhatsApp</span>
              <span className={styles.hint}>
                Удобно прислать фото помещения — сразу оценю задачу
              </span>
            </Card>
          </div>

          <div className={styles.formBox}>
            <h2 className={styles.formTitle}>Оставьте заявку</h2>
            <p className={styles.formLead}>
              Перезвоню в ближайшее время и отвечу на вопросы.
            </p>
            <LeadForm source="footer" />
          </div>
        </div>
      </Section>

      <Section className={styles.mapSection}>
        {/* TODO: карта Яндекса. Подключаем, когда будет адрес или точка
            выезда — пустая карта на весь экран пользы не приносит. */}
        <div className={styles.map} aria-hidden />
        <p className={styles.legal}>
          {site.legal.entity}, УНП {site.legal.unp}, {site.legal.address}
        </p>
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
      />
    </main>
  );
}
