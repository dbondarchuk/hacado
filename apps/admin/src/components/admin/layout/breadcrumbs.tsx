"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbsContext,
  BreadcrumbSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Link,
} from "@hacado/ui";
import { ChevronDownIcon } from "lucide-react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import React, { Fragment } from "react";

const useBreadcrumbs = () => {
  const pathname = usePathname();
  const { breadcrumbs, setBreadcrumbs } = React.useContext(BreadcrumbsContext);

  React.useEffect(() => {
    setBreadcrumbs(undefined);
  }, [pathname, setBreadcrumbs]);

  return breadcrumbs;
};

export const BreadcrumbsRender = () => {
  const items = useBreadcrumbs();
  if (!items?.length) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) =>
          "subItems" in item ? (
            <DropdownMenu key={index}>
              <DropdownMenuTrigger className="flex items-center gap-1">
                {item.title}
                <ChevronDownIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {item.subItems.map((subItem, jndex) => (
                  <DropdownMenuItem key={jndex} asChild>
                    <Link href={subItem.link}>{subItem.title}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Fragment key={item.title}>
              {index !== items.length - 1 && (
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <NextLink href={item.link}>{item.title}</NextLink>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              )}
              {index < items.length - 1 && (
                <BreadcrumbSeparator className="hidden md:block">
                  {/* <Slash /> */}
                </BreadcrumbSeparator>
              )}
              {index === items.length - 1 && (
                <BreadcrumbPage className="grid pr-1">
                  <span className="truncate">{item.title}</span>
                </BreadcrumbPage>
              )}
            </Fragment>
          ),
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
