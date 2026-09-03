import { type RouteConfig, index, route } from "@react-router/dev/routes";

// Карта сайта из PLAN.md §4.
// Портфолио и отзывы пока не заведены: они выключены флагом
// FEATURES.showPortfolio / showReviews до появления контента.
export default [
  index("routes/home/home.tsx"),

  route("catalog", "routes/catalog.tsx"),
  route("catalog/:category", "routes/catalog-category.tsx"),
  route("product/:slug", "routes/product.tsx"),

  route("solutions", "routes/solutions.tsx"),
  route("solutions/:slug", "routes/solution.tsx"),

  route("services", "routes/services/services.tsx"),
  route("services/:slug", "routes/services/service.tsx"),
  route("price", "routes/price/price.tsx"),

  route("articles", "routes/articles/articles.tsx"),
  route("articles/:slug", "routes/articles/article.tsx"),

  route("about", "routes/about/about.tsx"),
  route("contacts", "routes/contacts/contacts.tsx"),
  route("privacy", "routes/privacy/privacy.tsx"),

  route("*", "routes/not-found/not-found.tsx"),
] satisfies RouteConfig;
