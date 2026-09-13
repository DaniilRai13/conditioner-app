import { motion } from "framer-motion";
import { Container } from "~/components/ui/Container/Container";
import { IconBox } from "~/components/ui/IconBox/IconBox";
import { brandPoints } from "~/data/advantages";
import { steps } from "~/data/steps";
import {
  revealVariants,
  stepsVariants,
  stepTextVariants,
} from "~/lib/animations";
import styles from "./WhyMe.module.scss";

/**
 * Синий баннер «Работаю один» + «Как я работаю».
 * Склеены в одну секцию: вместе отвечают на «почему он» и «как это будет»,
 * по отдельности каждый блок слабее (PLAN.md §4).
 *
 * `reveal` — проявляться при прокрутке. Только по просьбе: блок стоит
 * и на главной, и на странице услуг, а там вокруг него ничего не движется.
 * Единственный движущийся элемент среди неподвижных читается как сбой,
 * а не как приём.
 */
export function WhyMe({ reveal }: { reveal?: boolean }) {
  // Секцию рисует сам, без общего компонента, — поэтому и появление
  // подключает сам. Тег выбирается заранее: motion-компонент тянет
  // за собой наблюдатель, и на страницах без появления он не нужен.
  const Tag = reveal ? motion.section : "section";

  /*
   * Движение шагов — тоже только по просьбе.
   *
   * motion-элементы без этих свойств рисуются обычными тегами, без единого
   * инлайнового стиля, поэтому подменять теги во второй раз не нужно.
   * А вот безусловная анимация была бы ошибкой вдвойне: на странице услуг
   * шаги ехали бы без спроса, и — хуже — их спрятанное состояние не попало бы
   * под страховку, которая ищет блоки по классу `reveal`.
   */
  const listMotion = reveal
    ? {
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once: false, amount: 0.15 },
        variants: stepsVariants,
      }
    : {};

  return (
    <Tag
      className={reveal ? `${styles.section} reveal` : styles.section}
      {...(reveal
        ? {
            initial: "hidden",
            whileInView: "visible",
            viewport: { once: false, amount: 0.1, margin: "0px 0px -8% 0px" },
            variants: revealVariants,
          }
        : {})}
    >
      <Container>
        <div className={styles.banner}>
          <div className={styles.bannerHead}>
            <h2 className={styles.bannerTitle}>
              Работаю один — отвечаю за результат лично
            </h2>
            <p className={styles.bannerLead}>
              Вы общаетесь напрямую со мной, без посредников. Это экономит ваше
              время и деньги.
            </p>
          </div>

          <ul className={styles.points}>
            {brandPoints.map((p) => (
              <li key={p.title} className={styles.point}>
                <IconBox name={p.icon} tone="onBrand" />
                <b className={styles.pointTitle}>{p.title}</b>
                <span className={styles.pointText}>{p.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.stepsHead}>
          <h2 className={styles.stepsTitle}>Как я работаю</h2>
          <p className={styles.stepsLead}>
            От звонка до работающего кондиционера — пять шагов. Ничего не
            начинаю, пока не согласуем модель, цену и дату: сюрпризов в смете не
            будет.
          </p>
        </div>
        {/*
          Лестница шагов. Задержки раздаёт список, направление — каждый
          текст сам: нечётные шаги стоят слева и выезжают слева, чётные
          справа. Номер на месте — он держит вертикальную линию, и если бы
          ехал вместе с текстом, линия рвалась бы на каждом шаге.

          Наблюдается список целиком, а не каждый шаг по отдельности: пять
          наблюдателей ради одной лестницы — перебор, а framer и так раздаёт
          состояние вниз по вложенным motion-элементам. Заодно это делает
          выход согласованным: лестница уходит из экрана целиком, и шаги
          возвращаются в исходное вместе, а не вразнобой.
        */}
        <motion.ol className={styles.steps} {...listMotion}>
          {steps.map((step, i) => (
            <motion.li key={step.title} className={styles.step}>
              <span className={styles.stepNumber}>{i + 1}</span>
              <motion.span
                className={styles.stepBody}
                {...(reveal
                  ? { variants: stepTextVariants, custom: i % 2 === 0 }
                  : {})}
              >
                <b className={styles.stepName}>{step.title}</b>
                <span className={styles.stepText}>{step.text}</span>
              </motion.span>
            </motion.li>
          ))}
        </motion.ol>
      </Container>
    </Tag>
  );
}
