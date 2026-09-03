import type { MetaFunction } from "react-router";
import { PageStub } from "~/components/layout/PageStub";

export const meta: MetaFunction = () => [
  { title: "Контакты — Климат Лайн" },
  { name: "description", content: "Телефон, мессенджеры, часы работы и зона выезда по Минску и области." },
];

export default function Page() {
  return <PageStub title="Контакты" note="Телефон, мессенджеры, часы работы и зона выезда по Минску и области." />;
}
