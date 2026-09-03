import type { MetaFunction } from "react-router";
import { PageStub } from "~/components/layout/PageStub";

export const meta: MetaFunction = () => [
  { title: "Каталог кондиционеров — Климат Лайн" },
  { name: "description", content: "Отобранные модели под квартиру, дом и офис. Наполнение появится после выгрузки каталога." },
];

export default function Page() {
  return <PageStub title="Каталог кондиционеров" note="Отобранные модели под квартиру, дом и офис. Наполнение появится после выгрузки каталога." />;
}
