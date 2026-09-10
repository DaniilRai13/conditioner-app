import { useSearchParams } from "react-router";
import { QUIZ_QUESTIONS, isComplete, type QuizAnswers } from "~/lib/quiz";

/**
 * Состояние подбора. Живёт в параметрах адреса, а не в useState.
 *
 * Так ссылку на результат можно отправить, работает кнопка «назад»
 * в браузере, и у результата появляется адрес для аналитики. Второе,
 * более важное здесь: подбор разнесён по двум блокам страницы — вопросы
 * в первом экране, ответ ниже, — и общее состояние в URL держит их вместе
 * без всякого контекста и подъёма состояния наверх.
 *
 * Шаг выводится из ответов, а не хранится отдельно. Отдельное состояние
 * тут уже было и приводило к тому, что «пройти заново» возвращало
 * на последний вопрос: React батчит обновления, и эффект-синхронизатор
 * успевал увидеть старые параметры адреса при уже сброшенном шаге.
 *
 * Считается индекс первого неотвеченного вопроса, а не количество ответов:
 * по ссылке могут прийти ответы с пропуском — например только `heat`, —
 * и при подсчёте количеством подбор завис бы на уже отвеченном шаге.
 */
export function useQuiz() {
  const [params, setParams] = useSearchParams();

  const answers: QuizAnswers = {
    area: params.get("area") ?? undefined,
    place: params.get("place") ?? undefined,
    heat: params.get("heat") ?? undefined,
    windows: params.get("windows") ?? undefined,
  };

  const done = isComplete(answers);
  const firstUnanswered = QUIZ_QUESTIONS.findIndex((q) => !answers[q.key]);
  const step = done ? QUIZ_QUESTIONS.length : firstUnanswered;

  function update(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(params);
    mutate(next);
    // replace — чтобы каждый ответ не засорял историю браузера.
    // preventScrollReset — чтобы страница не прыгала на ответ: в этом
    // и была главная претензия к прежнему подбору.
    setParams(next, { replace: true, preventScrollReset: true });
  }

  return {
    answers,
    step,
    done,

    choose(key: keyof QuizAnswers, value: string) {
      update((next) => next.set(key, value));
    },

    /**
     * Назад — к последнему отвеченному вопросу перед текущим.
     * При неполной ссылке это не обязательно предыдущий по порядку.
     */
    back() {
      for (let i = Math.min(step, QUIZ_QUESTIONS.length) - 1; i >= 0; i--) {
        const question = QUIZ_QUESTIONS[i];
        if (answers[question.key]) {
          update((next) => next.delete(question.key));
          return;
        }
      }
    },

    restart() {
      update((next) => QUIZ_QUESTIONS.forEach((q) => next.delete(q.key)));
    },
  };
}
