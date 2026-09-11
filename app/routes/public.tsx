import { Outlet } from "react-router";
import { PageDecor } from "~/components/layout/PageDecor/PageDecor";
import { PageViews } from "~/components/layout/PageViews/PageViews";
import { Header } from "~/components/layout/Header/Header";
import { Footer } from "~/components/layout/Footer/Footer";

/**
 * Обрамление публичных страниц: подложки-фигуры, шапка, подвал.
 *
 * Безадресный макет — в адресе он ничего не добавляет, а нужен, чтобы
 * отделить страницы сайта от админки. Раньше шапка и подвал жили в root,
 * то есть приходили вообще всему, и админка открывалась внутри сайта:
 * с меню «Каталог, Решения, Услуги» над формой входа.
 *
 * В root осталась только оболочка документа — html, head, скрипты. Это
 * и правильно: root описывает страницу как документ, а не как сайт.
 */
export default function PublicLayout() {
  return (
    <>
      {/* Счётчик посещений. Здесь, а не в root: админка в статистику
          попадать не должна — считаем посетителей, а не свою работу. */}
      <PageViews />
      <PageDecor />
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
