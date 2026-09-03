import type { MetaFunction } from "react-router";
import { PageStub } from "~/components/layout/PageStub";

export const meta: MetaFunction = () => [
  { title: "Политика обработки персональных данных — Климат Лайн" },
  { name: "description", content: "Какие данные собираются через формы сайта, зачем и как долго хранятся." },
];

export default function Page() {
  return <PageStub title="Политика обработки персональных данных" note="Какие данные собираются через формы сайта, зачем и как долго хранятся." />;
}
