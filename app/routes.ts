import { type RouteConfig, index, route } from "@react-router/dev/routes";

// Карта сайта из PLAN.md §4.
// Портфолио и отзывы пока не заведены: они выключены флагом
// FEATURES.showPortfolio / showReviews до появления контента.
export default [
  index("routes/home.tsx"),

  route("catalog", "routes/catalog.tsx"),
  route("catalog/:category", "routes/catalog-category.tsx"),
  route("product/:slug", "routes/product.tsx"),

  route("solutions", "routes/solutions.tsx"),
  route("solutions/:slug", "routes/solution.tsx"),

  route("services", "routes/services.tsx"),
  route("services/:slug", "routes/service.tsx"),
  route("price", "routes/price.tsx"),

  route("articles", "routes/articles.tsx"),
  route("articles/:slug", "routes/article.tsx"),

  route("about", "routes/about.tsx"),
  route("contacts", "routes/contacts.tsx"),
  route("privacy", "routes/privacy.tsx"),

  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
