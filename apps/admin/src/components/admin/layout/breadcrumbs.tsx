"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@hacado/ui/breadcrumb";
import { BreadcrumbsContext } from "@hacado/ui/breadcrumbs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@hacado/ui/dropdown-menu";
import { Link } from "@hacado/ui/link";
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
    <Breadcrumb className="min-w-0 flex-1 overflow-hidden">
      <BreadcrumbList className="text-sm @container/breadcrumbs flex-nowrap">
        {items.map((item, index) =>
          "subItems" in item ? (
            <DropdownMenu key={index}>
              <DropdownMenuTrigger
                className="flex min-w-0 max-w-full items-center gap-1"
                title={item.title}
              >
                <span className="truncate">{item.title}</span>
                <ChevronDownIcon className="size-4 shrink-0" />
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
                <BreadcrumbItem className="hidden max-w-[40%] @xs/breadcrumbs:block">
                  <BreadcrumbLink asChild>
                    <NextLink
                      href={item.link}
                      className="block truncate"
                      title={item.title}
                    >
                      {item.title}
                    </NextLink>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              )}
              {index < items.length - 1 && (
                <BreadcrumbSeparator className="hidden shrink-0 @xs/breadcrumbs:block">
                  {/* <Slash /> */}
                </BreadcrumbSeparator>
              )}
              {index === items.length - 1 && (
                <BreadcrumbPage
                  className="grid min-w-0 pr-1"
                  title={item.mobileTitle ?? item.title}
                >
                  {item.mobileTitle ? (
                    <>
                      <span className="truncate md:hidden">
                        {item.mobileTitle}
                      </span>
                      <span className="hidden truncate md:inline">
                        {item.title}
                      </span>
                    </>
                  ) : (
                    <span className="truncate">{item.title}</span>
                  )}
                </BreadcrumbPage>
              )}
            </Fragment>
          ),
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
