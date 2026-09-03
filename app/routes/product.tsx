import type { MetaFunction } from "react-router";
import { PageStub } from "~/components/layout/PageStub/PageStub";

export const meta: MetaFunction = () => [
  { title: "Модель кондиционера — Климат Лайн" },
  { name: "description", content: "Характеристики, цена и заявка на конкретную модель." },
];

export default function Page() {
  return <PageStub title="Карточка модели" note="Характеристики, цена и заявка на конкретную модель." />;
}
