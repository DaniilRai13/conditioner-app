import type { MetaFunction } from "react-router";
import { PageStub } from "~/components/layout/PageStub";

export const meta: MetaFunction = () => [
  { title: "Услуга — Климат Лайн" },
  { name: "description", content: "Что входит, как проходит работа, сроки и гарантия." },
];

export default function Page() {
  return <PageStub title="Услуга" note="Что входит, как проходит работа, сроки и гарантия." />;
}
