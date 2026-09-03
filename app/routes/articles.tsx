import type { MetaFunction } from "react-router";
import { PageStub } from "~/components/layout/PageStub";

export const meta: MetaFunction = () => [
  { title: "Полезное — Климат Лайн" },
  { name: "description", content: "Как выбрать кондиционер, чем инвертор отличается от обычного и когда нужна чистка." },
];

export default function Page() {
  return <PageStub title="Полезное" note="Как выбрать кондиционер, чем инвертор отличается от обычного и когда нужна чистка." />;
}
