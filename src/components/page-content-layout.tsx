"use client";

import { getPageBgClass, SIDEBAR_SURFACE_CLASS } from "@/lib/nav-theme";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

function nodeContainsH1(node: ReactNode): boolean {
  if (!isValidElement(node)) return false;
  if (node.type === "h1") return true;

  const inner = (node.props as { children?: ReactNode }).children;
  if (!inner) return false;

  return Children.toArray(inner).some((child) => nodeContainsH1(child));
}

function splitTitleFromBlock(node: ReactNode): {
  headerH1: ReactNode;
  headerSubtitle: ReactNode;
  blockRemainder: ReactNode;
} {
  if (!isValidElement(node)) {
    return { headerH1: node, headerSubtitle: null, blockRemainder: null };
  }

  const props = node.props as { children?: ReactNode; className?: string };
  const items = Children.toArray(props.children);
  const h1Index = items.findIndex((child) => isValidElement(child) && child.type === "h1");

  if (h1Index < 0) {
    return { headerH1: node, headerSubtitle: null, blockRemainder: null };
  }

  const subtitleCandidate = items[h1Index + 1];
  const headerSubtitle =
    isValidElement(subtitleCandidate) && subtitleCandidate.type === "p" ? subtitleCandidate : null;
  const consumed = headerSubtitle ? 2 : 1;
  const remaining = items.filter((_, index) => index < h1Index || index >= h1Index + consumed);

  return {
    headerH1: items[h1Index],
    headerSubtitle,
    blockRemainder:
      remaining.length > 0
        ? cloneElement(node as ReactElement<{ children?: ReactNode; className?: string }>, {
            children: remaining,
            className: cn(props.className, "min-w-0")
          })
        : null
  };
}

function splitPageChildren(children: ReactNode): {
  headerH1: ReactNode;
  headerSubtitle: ReactNode;
  body: ReactNode;
} {
  const topLevel = Children.toArray(children);

  if (topLevel.length === 1 && isValidElement(topLevel[0])) {
    const root = topLevel[0] as ReactElement<{ children?: ReactNode; className?: string }>;
    const rootTag = typeof root.type === "string" ? root.type : "";

    if (rootTag === "section" || rootTag === "div") {
      const items = Children.toArray(root.props.children);
      const headerIndex = items.findIndex(nodeContainsH1);

      if (headerIndex >= 0) {
        const { headerH1, headerSubtitle, blockRemainder } = splitTitleFromBlock(items[headerIndex]);
        const bodyItems = [
          ...(blockRemainder ? [blockRemainder] : []),
          ...items.filter((_, index) => index !== headerIndex)
        ];

        if (bodyItems.length === 0) {
          return { headerH1, headerSubtitle, body: null };
        }

        return {
          headerH1,
          headerSubtitle,
          body: cloneElement(root, {
            children: bodyItems,
            className: cn(root.props.className, "min-w-0")
          })
        };
      }
    }
  }

  const headerIndex = topLevel.findIndex(nodeContainsH1);
  if (headerIndex >= 0) {
    const { headerH1, headerSubtitle, blockRemainder } = splitTitleFromBlock(topLevel[headerIndex]);
    const bodyItems = [
      ...(blockRemainder ? [blockRemainder] : []),
      ...topLevel.filter((_, index) => index !== headerIndex)
    ];

    return {
      headerH1,
      headerSubtitle,
      body: bodyItems.length > 0 ? bodyItems : null
    };
  }

  return { headerH1: null, headerSubtitle: null, body: children };
}

export function PageContentLayout({
  title,
  subtitle,
  children
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const pageBg = getPageBgClass(pathname);
  const split = title
    ? { headerH1: null, headerSubtitle: null, body: children }
    : splitPageChildren(children);

  const headerH1 = title ? (
    <h1 className="text-2xl font-bold text-foreground lg:text-3xl">{title}</h1>
  ) : (
    split.headerH1
  );
  const headerSubtitle = subtitle ? (
    <p className="text-muted-foreground">{subtitle}</p>
  ) : (
    split.headerSubtitle
  );
  const body = split.body;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4" data-page-content-layout>
      {headerH1 ? (
        <div className={cn("shrink-0 rounded-2xl px-5 py-4 shadow-sm sm:px-6", pageBg)}>
          <div className="min-w-0">{headerH1}</div>
        </div>
      ) : null}

      {headerSubtitle ? <div className="max-w-3xl shrink-0 px-1">{headerSubtitle}</div> : null}

      {body ? (
        <div className={cn("min-h-0 flex-1 rounded-2xl p-5 shadow-sm sm:p-6", SIDEBAR_SURFACE_CLASS)}>{body}</div>
      ) : null}
    </div>
  );
}

PageContentLayout.displayName = "PageContentLayout";

export function isPageContentLayout(node: ReactNode): boolean {
  if (!isValidElement(node)) return false;
  if (node.type === PageContentLayout) return true;

  const props = node.props as { "data-page-content-layout"?: boolean };
  if (props["data-page-content-layout"] !== undefined) return true;

  const type = node.type as { displayName?: string; name?: string };
  return type?.displayName === "PageContentLayout" || type?.name === "PageContentLayout";
}
