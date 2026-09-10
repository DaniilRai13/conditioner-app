import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import { PageHeader } from "~/components/layout/PageHeader/PageHeader";
import { Section } from "~/components/ui/Section/Section";
import { Button } from "~/components/ui/Button/Button";
import { IconBox } from "~/components/ui/IconBox/IconBox";
import { AcUnit } from "~/components/decor/AcUnit/AcUnit";
import { advantages } from "~/data/advantages";
import { QUIZ_QUESTIONS, type QuizAnswers } from "~/lib/quiz";
import { site } from "~/config/site";
import styles from "./hero-fix.module.scss";

/**
 * Первый экран после разбора (PLAN.md §10, задача 5).
 * Временная страница, удаляется вместе с папкой `routes/dev`.
 *
 * Здесь собраны все четыре правки сразу — иначе их не оценить: они
 * держатся друг на друге. Панель ведёт весь подбор на месте, поэтому
 * кнопки больше не дублируют её и меняются, поэтому же освободилось
 * место под преимущества на десктопе и поменялся порядок на узких.
 *
 * Состояние здесь локальное, не в URL. В бою будет как у настоящего
 * квиза — в параметрах адреса: ссылку на результат можно отправить,
 * кнопка «назад» работает. Для витрины это лишний шум.
 */

export function meta() {
  return [
    { title: "Первый экран: правки — черновик" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

const POINTS = [
  {
    n: "5.1",
    title: "Ответ больше не выбрасывает вниз",
    text: "Панель ведёт все четыре шага на месте: клик по варианту меняет вопрос, а не адрес страницы. Прокрутка случается один раз — в самом конце, к готовому ответу. Попробуйте пройти подбор в макете ниже.",
  },
  {
    n: "5.2",
    title: "Преимущества закрывают пустоту",
    text: "На десктопе полоса «гарантия · установка · цены» переехала в левую колонку под кнопки. Она и закрывает дыру, из-за которой колонки расходились по высоте.",
  },
  {
    n: "5.3",
    title: "Кондиционер не разрывает блок",
    text: "В одной колонке порядок теперь такой: текст → кондиционер → панель → кнопки → преимущества. Блок приклеен к панели, кнопки ушли под неё. Сузьте окно до 1000 и до 500 — увидите оба случая.",
  },
  {
    n: "5.4",
    title: "Кнопки заменены",
    text: "«Подобрать кондиционер» вела к подбору, который теперь стоит рядом. Главной стала «Оставить заявку», второй — каталог. Телефон вместо каталога — тоже вариант, скажите, если так лучше.",
  },
];

function Hero() {
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [flash, setFlash] = useState(false);

  // Шаг выводится из ответов, а не хранится отдельно: то же правило,
  // что в настоящем квизе — дублирующее состояние там уже приводило
  // к тому, что «пройти заново» возвращало на последний вопрос.
  const firstUnanswered = QUIZ_QUESTIONS.findIndex((q) => !answers[q.key]);
  const done = firstUnanswered === -1;
  const step = done ? QUIZ_QUESTIONS.length : firstUnanswered;
  const question = QUIZ_QUESTIONS[Math.min(step, QUIZ_QUESTIONS.length - 1)];

  function choose(key: keyof QuizAnswers, value: string) {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    // В бою здесь будет прокрутка к результату — но только когда
    // все четыре ответа собраны, а не после каждого.
    if (QUIZ_QUESTIONS.every((q) => next[q.key])) {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 1600);
    }
  }

  function back() {
    for (let i = Math.min(step, QUIZ_QUESTIONS.length) - 1; i >= 0; i--) {
      const q = QUIZ_QUESTIONS[i];
      if (answers[q.key]) {
        const next = { ...answers };
        delete next[q.key];
        setAnswers(next);
        return;
      }
    }
  }

  return (
    <div className={styles.hero}>
      <div className={styles.grid}>
        <div className={styles.content}>
          <p className={styles.kicker}>Подбор за 4 вопроса</p>
          <h3 className={styles.title}>
            Продажа и установка кондиционеров в Минске и области
          </h3>
          <p className={styles.lead}>
            Не знаете, какой нужен? Ответьте на четыре вопроса — покажу три
            модели под ваше помещение. Без звонка и без телефона.
          </p>
        </div>

        <div className={styles.side}>
          <AcUnit className={styles.ac} />

          <div className={styles.panel}>
            {done ? (
              <div className={styles.result}>
                <span className={styles.panelLabel}>Готово</span>
                <b className={styles.question}>Подобрал три модели</b>
                <p className={styles.resultText}>
                  Помещение до {answers.area} м², {question.options[0].hint}.
                  Смотрите ниже — они с ценами и характеристиками.
                </p>
                <div className={styles.resultActions}>
                  <Button size="lg" className={styles.wide}>
                    Показать модели
                  </Button>
                  <button
                    type="button"
                    className={styles.restart}
                    onClick={() => setAnswers({})}
                  >
                    <RotateCcw size={14} aria-hidden />
                    Пройти заново
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.bar} aria-hidden>
                  <span
                    className={styles.barFill}
                    style={{
                      width: `${(step / QUIZ_QUESTIONS.length) * 100}%`,
                    }}
                  />
                </div>

                <span className={styles.panelLabel}>
                  Шаг {step + 1} из {QUIZ_QUESTIONS.length}
                </span>
                <b className={styles.question}>{question.title}</b>

                <div className={styles.options}>
                  {question.options.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      className={styles.option}
                      onClick={() => choose(question.key, o.value)}
                    >
                      <span className={styles.optionLabel}>{o.label}</span>
                      {o.hint && (
                        <span className={styles.optionHint}>{o.hint}</span>
                      )}
                      <ArrowRight
                        size={16}
                        className={styles.optionArrow}
                        aria-hidden
                      />
                    </button>
                  ))}
                </div>

                {step > 0 ? (
                  <button
                    type="button"
                    className={styles.back}
                    onClick={back}
                  >
                    <ArrowLeft size={14} aria-hidden />
                    Назад
                  </button>
                ) : (
                  <p className={styles.panelNote}>
                    В конце — три модели с ценами. Телефон не спрашиваю.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Кнопки отдельным элементом сетки, а не внутри текста: только
            так их можно опустить под панель на узком экране, оставив
            на десктопе под абзацем. */}
        <div className={styles.actions}>
          <Button size="lg">Оставить заявку</Button>
          <Button size="lg" variant="secondary" className={styles.glass}>
            Смотреть каталог
          </Button>
        </div>

        <ul className={styles.list}>
          {advantages.map((item) => (
            <li key={item.title} className={styles.advantage}>
              <IconBox name={item.icon} size="sm" tone="onBrand" />
              <span className={styles.advantageText}>
                <b>{item.title}</b>
                <span>{item.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* То, к чему прокрутит в конце: результат живёт секцией ниже,
          потому что три карточки товара в панель не помещаются. */}
      <div
        className={[styles.below, flash && styles.flashOn]
          .filter(Boolean)
          .join(" ")}
      >
        <Check size={18} aria-hidden />
        {done
          ? "Сюда прокрутит после четвёртого ответа — один раз и к готовому результату"
          : "Здесь будет блок с тремя моделями. Пока подбор не закончен, страница не двигается"}
      </div>
    </div>
  );
}

export default function DevHeroFix() {
  return (
    <main>
      <PageHeader
        title="Первый экран: четыре правки"
        lead="Все четыре сделаны разом — по отдельности их не оценить, они держатся друг на друге. Макет ниже рабочий: подбор проходится."
        crumbs={[{ label: "Первый экран" }]}
      />

      <Section>
        <Hero />
      </Section>

      <Section title="Что именно поменялось">
        <ol className={styles.points}>
          {POINTS.map((p) => (
            <li key={p.n} className={styles.point}>
              <span className={styles.pointNum}>{p.n}</span>
              <div>
                <b className={styles.pointTitle}>{p.title}</b>
                <p className={styles.pointText}>{p.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className={styles.note}>
          Чего в макете нет намеренно: состояние здесь локальное, а в бою
          останется в адресе страницы, как у нынешнего квиза, — чтобы ссылку
          на результат можно было отправить и работала кнопка «назад».
          Секция квиза с сайта не исчезнет, а станет блоком результата.
          Телефон {site.phone} вместо каталога во второй кнопке — тоже
          вариант, скажите, если так лучше.
        </p>
      </Section>
    </main>
  );
}
