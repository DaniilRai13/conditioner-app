import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link } from "react-router";
import styles from "./Button.module.scss";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

type BaseProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
};

type ButtonProps = BaseProps &
  ComponentPropsWithoutRef<"button"> & { to?: never; href?: never };

type LinkProps = BaseProps & { to: string; href?: never };

type AnchorProps = BaseProps &
  ComponentPropsWithoutRef<"a"> & { href: string; to?: never };

type Props = ButtonProps | LinkProps | AnchorProps;

function classes(variant: Variant, size: Size, className?: string) {
  return [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ");
}

/**
 * Одна кнопка на три случая: внутренняя ссылка (`to`), внешняя (`href`)
 * и обычная кнопка. Внутренние ссылки идут через <Link>, иначе теряется
 * клиентская навигация и каждый переход перезагружает страницу.
 */
export function Button(props: Props) {
  const { children, variant = "primary", size = "md", className } = props;
  const cn = classes(variant, size, className);

  if ("to" in props && props.to !== undefined) {
    const { to, children: _c, variant: _v, size: _s, className: _cl, ...rest } = props;
    return (
      <Link to={to} className={cn} {...rest}>
        {children}
      </Link>
    );
  }

  if ("href" in props && props.href !== undefined) {
    const { children: _c, variant: _v, size: _s, className: _cl, ...rest } = props;
    return (
      <a className={cn} {...rest}>
        {children}
      </a>
    );
  }

  const { children: _c, variant: _v, size: _s, className: _cl, ...rest } = props;
  return (
    <button type="button" className={cn} {...rest}>
      {children}
    </button>
  );
}
