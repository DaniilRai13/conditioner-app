import type { MetaFunction } from "react-router";
import { PageStub } from "~/components/layout/PageStub";

export const meta: MetaFunction = () => [
  { title: "Услуги — Климат Лайн" },
  { name: "description", content: "Продажа, установка, обслуживание и ремонт кондиционеров в Минске и области." },
];

export default function Page() {
  return <PageStub title="Услуги" note="Продажа, установка, обслуживание и ремонт кондиционеров в Минске и области." />;
}
