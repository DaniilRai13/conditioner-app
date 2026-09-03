import type { MetaFunction } from "react-router";
import { PageStub } from "~/components/layout/PageStub";

export const meta: MetaFunction = () => [
  { title: "Сколько стоит установка кондиционера — Климат Лайн" },
  { name: "description", content: "Цены на установку по мощности, что входит в стандартный монтаж и что оплачивается отдельно." },
];

export default function Page() {
  return <PageStub title="Прайс на монтаж" note="Цены на установку по мощности, что входит в стандартный монтаж и что оплачивается отдельно." />;
}
