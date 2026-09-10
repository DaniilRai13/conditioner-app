import { type RouteConfig, index, route } from "@react-router/dev/routes";

// Карта сайта из PLAN.md §4.
// Портфолио и отзывы пока не заведены: они выключены флагом
// FEATURES.showPortfolio / showReviews до появления контента.
export default [
  index("routes/home/home.tsx"),

  route("catalog", "routes/catalog/catalog.tsx"),
  route("catalog/:category", "routes/catalog/catalog-category.tsx"),
  route("product/:slug", "routes/catalog/product.tsx"),

  route("solutions", "routes/solutions/solutions.tsx"),
  route("solutions/:slug", "routes/solutions/solution.tsx"),

  route("services", "routes/services/services.tsx"),
  route("services/:slug", "routes/services/service.tsx"),
  route("price", "routes/price/price.tsx"),

  route("articles", "routes/articles/articles.tsx"),
  route("articles/:slug", "routes/articles/article.tsx"),

  route("about", "routes/about/about.tsx"),
  route("contacts", "routes/contacts/contacts.tsx"),
  route("privacy", "routes/privacy/privacy.tsx"),

  // Ресурсные роуты без компонента: на пререндере становятся файлами.
  route("sitemap.xml", "routes/sitemap.ts"),
  route("robots.txt", "routes/robots.ts"),

  // Временная витрина шрифтов. Удаляется вместе с папкой routes/dev.
  route("dev/type", "routes/dev/type.tsx"),
  route("dev/services", "routes/dev/services.tsx"),
  route("dev/cards", "routes/dev/cards.tsx"),
  route("dev/home", "routes/dev/home.tsx"),
  route("dev/form", "routes/dev/form.tsx"),
  route("dev/steps", "routes/dev/steps.tsx"),
  route("dev/filters", "routes/dev/filters.tsx"),
  route("dev/bg", "routes/dev/bg.tsx"),
  route("dev/bg2", "routes/dev/bg2.tsx"),
  route("dev/hero", "routes/dev/hero.tsx"),
  route("dev/og", "routes/dev/og.tsx"),
  route("dev/unit", "routes/dev/unit.tsx"),
  route("dev/hero-fix", "routes/dev/hero-fix.tsx"),
  route("dev/palette", "routes/dev/palette.tsx"),

  route("*", "routes/not-found/not-found.tsx"),
] satisfies RouteConfig;
