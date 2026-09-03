import { Container } from "~/components/ui/Container";
import { IconBox } from "~/components/ui/IconBox";
import { brandPoints } from "~/data/advantages";
import { steps } from "~/data/steps";
import styles from "./WhyMe.module.scss";

/**
 * Синий баннер «Работаю один» + «Как я работаю».
 * Склеены в одну секцию: вместе отвечают на «почему он» и «как это будет»,
 * по отдельности каждый блок слабее (PLAN.md §4).
 */
export function WhyMe() {
  return (
    <section className={styles.section}>
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

        <h2 className={styles.stepsTitle}>Как я работаю</h2>
        <ol className={styles.steps}>
          {steps.map((step, i) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepNumber}>{i + 1}</span>
              <b className={styles.stepName}>{step.title}</b>
              <span className={styles.stepText}>{step.text}</span>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
