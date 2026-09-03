import type { MetaFunction } from "react-router";
import { PageStub } from "~/components/layout/PageStub";

export const meta: MetaFunction = () => [
  { title: "Обо мне — Климат Лайн" },
  { name: "description", content: "Кто выполняет работы, опыт и принципы. Работаю один и отвечаю за результат лично." },
];

export default function Page() {
  return <PageStub title="Обо мне" note="Кто выполняет работы, опыт и принципы. Работаю один и отвечаю за результат лично." />;
}
