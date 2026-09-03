import type { MetaFunction } from "react-router";
import { PageStub } from "~/components/layout/PageStub";

export const meta: MetaFunction = () => [
  { title: "Категория каталога — Климат Лайн" },
  { name: "description", content: "Страница типа кондиционеров: бытовые сплит-системы, мульти-сплит, мобильные и полупромышленные." },
];

export default function Page() {
  return <PageStub title="Категория каталога" note="Страница типа кондиционеров: бытовые сплит-системы, мульти-сплит, мобильные и полупромышленные." />;
}
