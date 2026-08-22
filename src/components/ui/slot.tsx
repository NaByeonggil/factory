import { Children, cloneElement, isValidElement, type ReactElement } from "react";
import { cn } from "@/lib/utils";

/**
 * asChild 패턴용 최소 Slot (radix 의존 없이).
 * 서버 컴포넌트로 유지해야 합니다 — "use client"를 붙이면 RSC 경계를 넘어온
 * children이 lazy 참조가 되어 Children.only가 실패합니다.
 */
export function Slot({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  const child = Children.only(children);
  if (!isValidElement(child)) return null;

  const typed = child as ReactElement<React.HTMLAttributes<HTMLElement>>;

  return cloneElement(typed, {
    ...props,
    ...typed.props,
    className: cn(className, typed.props.className),
  });
}
