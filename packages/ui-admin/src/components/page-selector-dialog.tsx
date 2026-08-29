"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { PageListModelWithUrl } from "@hacado/types";
import {
  Button,
  cn,
  Input,
  Modal,
  RadioGroup,
  RadioGroupItem,
  ScrollArea,
  Skeleton,
  toast,
  useDebounce,
} from "@hacado/ui";
import React from "react";
import { useInView } from "react-intersection-observer";

export type PageSelectorDialogProps = {
  onSelected: (page: PageListModelWithUrl) => void;
  isOpen: boolean;
  close: () => void;
  portalContainer?: React.ComponentProps<typeof Modal>["portalContainer"];
};

const Loader: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      "border rounded-md flex flex-row gap-2 cursor-pointer p-2 items-center",
      className,
    )}
  >
    <Skeleton className="w-4 h-4" />
    <div className="flex flex-col gap-0.5">
      <Skeleton className="max-w-72 min-w-52 w-full h-6" />
      <Skeleton className="max-w-72 min-w-52 w-full h-4" />
      <Skeleton className="max-w-72 min-w-52 w-full h-4" />
    </div>
  </div>
);

const Loaders = () => (
  <div className="grid grid-cols-1 gap-2">
    <Loader />
    <Loader />
    <Loader />
    <Loader />
  </div>
);

const toLoad = 24; // divisible by 1, 2, 3

export const PageSelectorDialog: React.FC<PageSelectorDialogProps> = ({
  onSelected,
  close,
  isOpen,
  portalContainer,
}) => {
  const t = useI18n("ui");
  const [selected, setSelected] = React.useState<
    PageListModelWithUrl | undefined
  >(undefined);

  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [pages, setPages] = React.useState<PageListModelWithUrl[]>([]);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [initialLoad, setInitialLoad] = React.useState(true);
  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  // Reset when search changes
  React.useEffect(() => {
    setPages([]);
    setPage(1);
    setHasMore(true);
  }, [debouncedSearch]);

  const loadPages = React.useCallback(async (page: number, search?: string) => {
    const result = await adminApi.pages.getPages({
      page,
      limit: toLoad,
      search,
    });

    return {
      items: result.items,
      hasMore: page * toLoad < result.total,
    };
  }, []);

  React.useEffect(() => {
    const loadItems = async () => {
      if (!hasMore && !initialLoad) return;

      setLoading(true);
      try {
        const result = await loadPages(page, debouncedSearch);

        if (page === 1) {
          setPages(result.items);
        } else {
          setPages((prev) => [...prev, ...result.items]);
        }

        setHasMore(result.hasMore);
        setInitialLoad(false);
      } catch (error) {
        console.error("Failed to fetch items:", error);
        toast.error(t("common.requestFailed"));
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadItems();
    }
  }, [debouncedSearch, page, loadPages, initialLoad, hasMore, isOpen, t]);

  // Load more when scrolled to bottom
  React.useEffect(() => {
    if (isOpen && inView && !loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [inView, loading, hasMore, isOpen]);

  const select = (page: PageListModelWithUrl) => {
    setSelected(selected?._id === page._id ? undefined : page);
  };

  const selectAndClose = () => {
    if (!selected) return;

    onSelected(selected);
    close();
  };

  React.useEffect(() => {
    setSelected(undefined);
    if (!isOpen) {
      setInitialLoad(false);
      setPage(1);
      setHasMore(true);
      setPages([]);
      setSearch("");
    }
  }, [isOpen]);

  const onClose = () => {
    close();
  };

  return (
    <Modal
      title={t("pageSelector.title")}
      isOpen={isOpen}
      onClose={onClose}
      // className="sm:max-w-[80%]"
      portalContainer={portalContainer}
    >
      <div className="flex flex-col gap-4">
        <div className="w-full">
          <Input
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ScrollArea className="w-full h-[60vh]">
          {loading && page === 1 && <Loaders />}
          <div className="w-full" id="page-scroll-area">
            <div className="grid grid-cols-1 gap-2">
              <RadioGroup
                value={selected?._id}
                onValueChange={(value) =>
                  setSelected(pages.find((p) => p._id === value))
                }
              >
                {pages?.map((page) => (
                  <div
                    tabIndex={0}
                    onClick={() => setSelected(page)}
                    onKeyDown={(e) =>
                      (e.key === "Enter" || e.key === " ") && select(page)
                    }
                    className={cn(
                      "border rounded-md flex flex-row gap-2 cursor-pointer p-2 items-center",
                      selected?._id === page._id ? "bg-accent" : "",
                    )}
                    key={page._id}
                  >
                    <RadioGroupItem value={page._id} />
                    <div className="flex flex-col gap-0.5">
                      <span>
                        {page.title}{" "}
                        <span className="text-muted-foreground text-sm">
                          /{page.slug}
                        </span>
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {page.description}
                      </span>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
          {hasMore && !loading && <div ref={ref} className="h-1" />}
          {loading && page > 1 && <Loaders />}
        </ScrollArea>
      </div>
      <div className="flex w-full items-center justify-end space-x-2 pt-6">
        <Button type="button" variant="secondary" onClick={close}>
          {t("common.close")}
        </Button>
        <Button type="button" disabled={!selected} onClick={selectAndClose}>
          {t("form.select")}
        </Button>
      </div>
    </Modal>
  );
};
