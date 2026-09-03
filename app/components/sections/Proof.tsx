import { Section } from "~/components/ui/Section";
import { FEATURES } from "~/config/site";

/**
 * «Работы и отзывы» — объединённый блок доверия (PLAN.md §4).
 *
 * Пока у заказчика нет ни фото работ, ни отзывов, секция не рендерится вовсе.
 * Ставить сюда сток нельзя: для частного мастера чужие фото монтажа опаснее,
 * чем их отсутствие — клиент узнаёт сток и теряет доверие.
 * Включается флагами FEATURES.showPortfolio / showReviews.
 */
export function Proof() {
  if (!FEATURES.showPortfolio && !FEATURES.showReviews) return null;

  return (
    <Section
      title="Работы и отзывы"
      lead="Примеры выполненных установок и что говорят клиенты."
    >
      {/* TODO: сетка «до/после» и карточки отзывов — как появится контент. */}
    </Section>
  );
}
