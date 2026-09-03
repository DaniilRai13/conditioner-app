import type { MetaFunction } from "react-router";
import { PageStub } from "~/components/layout/PageStub";

export const meta: MetaFunction = () => [
  { title: "Решение под площадь — Климат Лайн" },
  { name: "description", content: "Расчёт мощности, три модели на выбор и состав монтажа." },
];

export default function Page() {
  return <PageStub title="Решение под площадь" note="Расчёт мощности, три модели на выбор и состав монтажа." />;
}
