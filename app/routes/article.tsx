import type { MetaFunction } from "react-router";
import { PageStub } from "~/components/layout/PageStub";

export const meta: MetaFunction = () => [
  { title: "Статья — Климат Лайн" },
  { name: "description", content: "Материал раздела Полезное." },
];

export default function Page() {
  return <PageStub title="Статья" note="Материал раздела Полезное." />;
}
