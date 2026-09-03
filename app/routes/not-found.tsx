import type { MetaFunction } from "react-router";
import { PageStub } from "~/components/layout/PageStub";

export const meta: MetaFunction = () => [
  { title: "Страница не найдена — Климат Лайн" },
  { name: "description", content: "Такой страницы нет. Возможно, она переехала — начните с главной или каталога." },
];

export default function Page() {
  return <PageStub title="Страница не найдена" note="Такой страницы нет. Возможно, она переехала — начните с главной или каталога." />;
}
