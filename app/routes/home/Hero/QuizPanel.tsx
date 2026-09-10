import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "~/components/ui/Button/Button";
import { useRovingFocus } from "~/hooks/useRovingFocus";
import { QUIZ_QUESTIONS, type QuizAnswers } from "~/lib/quiz";
import styles from "./Hero.module.scss";

type Props = {
  answers: QuizAnswers;
  step: number;
  done: boolean;
  onChoose: (key: keyof QuizAnswers, value: string) => void;
  onBack: () => void;
  onRestart: () => void;
};

/**
 * Панель подбора в первом экране: вопрос, варианты, прогресс.
 *
 * Отделена от Hero, потому что тот сводится к заголовку, кнопкам и полосе
 * преимуществ, а всё остальное место занимала эта панель — вместе они
 * читались как один длинный файл про две разные вещи.
 *
 * Состояние сюда приходит пропсами: панель ничего не знает про адрес
 * страницы и про то, где живут ответы. Хранит их `useQuiz`, а показывает
 * их и результат — эта панель и QuizResult ниже по странице.
 *
 * Стили берутся из Hero.module.scss: панель существует только внутри
 * первого экрана и делит с ним тёмный фон, отступы и правила переноса.
 * Свой файл стилей здесь означал бы два места для одних и тех же чисел.
 */
export function QuizPanel({
  answers,
  step,
  done,
  onChoose,
  onBack,
  onRestart,
}: Props) {
  const question = QUIZ_QUESTIONS[Math.min(step, QUIZ_QUESTIONS.length - 1)];
  const { ref, onKeyDown } = useRovingFocus<HTMLDivElement>({
    step,
    disabled: done,
  });

  if (done) {
    return (
      <div
        className={styles.panel}
        role="group"
        aria-labelledby="hero-question"
      >
        <span className={styles.panelLabel}>Готово</span>
        <b id="hero-question" className={styles.question}>
          Подобрал три модели
        </b>
        <p className={styles.panelText}>
          Под помещение до {answers.area} м². Смотрите ниже — они с ценами и
          характеристиками.
        </p>
        <div className={styles.resultActions}>
          <Button to="/#quiz" size="lg" className={styles.wide}>
            Показать модели
          </Button>
          <button type="button" className={styles.restart} onClick={onRestart}>
            <RotateCcw size={14} aria-hidden />
            Пройти заново
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel} role="group" aria-labelledby="hero-question">
      <div className={styles.bar} aria-hidden>
        <span
          className={styles.barFill}
          style={{ width: `${(step / QUIZ_QUESTIONS.length) * 100}%` }}
        />
      </div>

      <span className={styles.panelLabel} aria-live="polite">
        Шаг {step + 1} из {QUIZ_QUESTIONS.length}
      </span>
      <b id="hero-question" className={styles.question}>
        {question.title}
      </b>

      <div
        ref={ref}
        className={styles.options}
        role="radiogroup"
        aria-label={question.title}
        onKeyDown={onKeyDown}
      >
        {question.options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={answers[question.key] === option.value}
            className={styles.option}
            onClick={() => onChoose(question.key, option.value)}
          >
            <span className={styles.optionLabel}>{option.label}</span>
            {option.hint && (
              <span className={styles.optionHint}>{option.hint}</span>
            )}
            <ArrowRight size={16} className={styles.optionArrow} aria-hidden />
          </button>
        ))}
      </div>

      {step > 0 ? (
        <button type="button" className={styles.back} onClick={onBack}>
          <ArrowLeft size={14} aria-hidden />
          Назад
        </button>
      ) : (
        <p className={styles.panelNote}>
          В конце — три модели с ценами. Телефон не спрашиваю.
        </p>
      )}
    </div>
  );
}
