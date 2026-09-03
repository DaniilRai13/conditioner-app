import type { MetaFunction } from "react-router";
import { PageStub } from "~/components/layout/PageStub";

export const meta: MetaFunction = () => [
  { title: "Готовые решения по площади — Климат Лайн" },
  { name: "description", content: "Подборки под спальню, гостиную, студию и офис — с ценой под ключ." },
];

export default function Page() {
  return <PageStub title="Готовые решения" note="Подборки под спальню, гостиную, студию и офис — с ценой под ключ." />;
}
