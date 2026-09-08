import type { MetaFunction } from "react-router";
import { Check, Clock } from "lucide-react";
import type { Route } from "./+types/home";
import { getCatalogProducts } from "~/lib/queries";
import { Hero } from "./Hero/Hero";
import { HERO_AVIF, HERO_SIZES } from "./Hero/heroImage";
import { Quiz } from "./Quiz/Quiz";
import { SolutionsPreview } from "./SolutionsPreview/SolutionsPreview";
import { ServicesPreview } from "./ServicesPreview/ServicesPreview";
import { WhyMe } from "~/components/sections/WhyMe/WhyMe";
import { Proof } from "./Proof";
import { Faq } from "~/components/sections/Faq/Faq";
import { faq } from "~/data/faq";
import { Section } from "~/components/ui/Section/Section";
import { LeadForm } from "~/components/forms/LeadForm/LeadForm";
import { site } from "~/config/site";
import styles from "./home.module.scss";

export function loader() {
  // Квизу нужен весь каталог: он фильтрует его на клиенте по ответам.
  return { products: getCatalogProducts() };
}

/**
 * Предзагрузка LCP-картинки. Без неё браузер найдёт <img> только после
 * разбора разметки — на медленной сети это заметные полсекунды к LCP.
 *
 * Тип указан явно: браузеры без поддержки AVIF просто проигнорируют
 * эту ссылку и возьмут WebP из <picture>. Лишней загрузки не будет.
 */
export const links = () => [
  {
    rel: "preload",
    as: "image",
    type: "image/avif",
    imageSrcSet: HERO_AVIF,
    imageSizes: HERO_SIZES,
    fetchPriority: "high",
    // На экранах до 480px картинка скрыта (mq(xs) в Hero.module.scss),
    // и предзагружать её там — тратить канал самых слабых устройств
    // на то, чего они не увидят. Значение должно совпадать с брейкпоинтом xs.
    media: "(min-width: 481px)",
  },
];

/**
 * Canonical жёстко на «/»: ответы квиза живут в query-параметрах главной,
 * и без этого каждая комбинация ответов уехала бы в индекс отдельной
 * страницей с одинаковым содержимым.
 */
export const meta: MetaFunction = () => [
  { tagName: "link", rel: "canonical", href: site.url },
  { title: `${site.name} — установка кондиционеров в Минске и области` },
  {
    name: "description",
    content:
      "Подберу, поставлю и настрою кондиционер под ваши задачи. Работает один специалист — без посредников и лишних наценок.",
  },
];

// Семь секций (PLAN.md §4). Порядок не случайный: квиз стоит вторым,
// пока внимание максимально, а FAQ идёт перед формой — снимает последние
// возражения ровно перед тем, как просить контакты.
export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <main>
      <Hero />
      <Quiz products={loaderData.products} />
      <SolutionsPreview />
      <ServicesPreview />
      <WhyMe />
      <Proof />

      <Section
        title="Частые вопросы"
        lead="Собрал то, о чём спрашивают чаще всего. Если вашего вопроса тут нет — напишите, отвечу лично."
      >
        <Faq items={faq} />
      </Section>

      <Section id="lead">
        <div className={styles.contactBox}>
          <div className={styles.contactHead}>
            <h2 className={styles.contactTitle}>Оставьте заявку</h2>
            <p className={styles.contactLead}>
              Перезвоню, уточню детали и назову точную стоимость. Замер и
              консультация — бесплатно.
            </p>

            {/* Не заполнение пустоты, а ответ на возражения, которые
                возникают ровно здесь: «сколько ждать», «не втянут ли меня
                в разговор с менеджером», «не назовут ли потом другую цену».
                Это последний блок перед подвалом — момент, когда человек
                либо оставляет контакты, либо уходит. */}
            <ul className={styles.contactList}>
              {[
                "Перезвоню в течение часа в рабочее время",
                "Смету назову до начала работ, а не по факту",
                "Отвечаю лично — колл-центра и менеджеров нет",
                "Не подойдёт по площади — скажу сразу, а не продам лишнее",
              ].map((t) => (
                <li key={t}>
                  <Check size={16} aria-hidden />
                  {t}
                </li>
              ))}
            </ul>

            <p className={styles.contactHours}>
              <Clock size={16} aria-hidden />
              {site.workHours}
            </p>
          </div>

          <LeadForm source="home" />
        </div>
      </Section>
    </main>
  );
}
