import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

// Карта сайта из PLAN.md §4.
// Портфолио и отзывы пока не заведены: они выключены флагом
// FEATURES.showPortfolio / showReviews до появления контента.
export default [
  // Публичные страницы — внутри общего обрамления: подложки, шапка, подвал.
  // Админка стоит рядом, а не внутри: инструменту меню сайта ни к чему.
  layout("routes/public.tsx", [
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

    // «Страница не найдена» — тоже страница сайта: с шапкой, подвалом
    // и ссылками, по которым можно уйти дальше.
    route("*", "routes/not-found/not-found.tsx"),
  ]),

  // Ресурсные роуты без компонента: на пререндере становятся файлами.
  route("sitemap.xml", "routes/sitemap.ts"),
  route("robots.txt", "routes/robots.ts"),

  // Админка. Не пререндерится и закрыта в robots.txt: это инструмент,
  // а не страница сайта. Защита — пароль Supabase и RLS, не адрес.
  route("admin", "routes/admin/layout.tsx", [
    // На входе — сводка, а не список заявок. Список удобен ровно до тех
    // пор, пока заявок мало: он не отвечает ни на «сколько их было
    // за месяц», ни на «что на сайте ещё не готово».
    index("routes/admin/dashboard.tsx"),
    route("leads", "routes/admin/leads.tsx"),
    route("prices", "routes/admin/prices.tsx"),
    route("products", "routes/admin/products.tsx"),
    route("reviews", "routes/admin/reviews.tsx"),
    route("portfolio", "routes/admin/portfolio.tsx"),
  ]),
] satisfies RouteConfig;
