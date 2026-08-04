"use client";

import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { UploadedFile } from "@timelish/types";
import {
  Button,
  cn,
  DndFileInput,
  Input,
  Modal,
  Progress,
  ScrollArea,
  Skeleton,
  Spinner,
  toast,
  useDebounce,
  useUploadFile,
} from "@timelish/ui";
import React from "react";
import { Accept } from "react-dropzone";
import { useInView } from "react-intersection-observer";
import { AssetPreview } from "./asset-preview";

export type AssetSelectorProps = {
  accept?: string[];
  onSelected: (asset: UploadedFile) => void;
  isOpen: boolean;
  close: () => void;
  addTo?: {
    appointmentId?: string;
    customerId?: string;
    description?: string;
  };
};

const Loader: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      "border rounded-md flex flex-col gap-3 items-center justify-between cursor-pointer py-3",
      className,
    )}
  >
    <Skeleton className="w-16 h-16" />
    <div className="flex flex-col gap-1 items-center text-center">
      <Skeleton className="max-w-72 min-w-52 w-full h-6" />
      <Skeleton className="max-w-72 min-w-52 w-full h-5" />
    </div>
  </div>
);

const Loaders = () => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    <Loader />
    <Loader />
    <Loader className="max-lg:hidden" />
    <Loader className="max-xl:hidden" />
  </div>
);

const toLoad = 24; // divisible by 1, 2, 3

export const AssetSelectorDialog: React.FC<AssetSelectorProps> = ({
  accept,
  onSelected,
  close,
  isOpen,
  addTo,
}) => {
  const t = useI18n("ui");
  const tAdmin = useI18n("admin");
  const [selected, setSelected] = React.useState<UploadedFile | undefined>(
    undefined,
  );

  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [assets, setAssets] = React.useState<UploadedFile[]>([]);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [initialLoad, setInitialLoad] = React.useState(true);
  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  // Reset when search changes
  React.useEffect(() => {
    setAssets([]);
    setPage(1);
    setHasMore(true);
  }, [debouncedSearch]);

  const loadAssets = React.useCallback(
    async (page: number, search?: string) => {
      const result = await adminApi.assets.getAssets({
        page,
        limit: toLoad,
        search,
        accept: accept ?? undefined,
      });

      return {
        items: result.items,
        hasMore: page * toLoad < result.total,
      };
    },
    [accept],
  );

  React.useEffect(() => {
    const loadItems = async () => {
      if (!hasMore && !initialLoad) return;

      setLoading(true);
      try {
        const result = await loadAssets(page, debouncedSearch);

        if (page === 1) {
          setAssets(result.items);
        } else {
          setAssets((prev) => [...prev, ...result.items]);
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
  }, [debouncedSearch, page, loadAssets, initialLoad, hasMore, isOpen, t]);

  // Load more when scrolled to bottom
  React.useEffect(() => {
    if (isOpen && inView && !loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [inView, loading, hasMore, isOpen]);

  const select = (asset: UploadedFile) => {
    setSelected(selected?._id === asset._id ? undefined : asset);
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
      setAssets([]);
      setSearch("");
    }
  }, [isOpen]);

  const [fileToUpload, setFileToUpload] = React.useState<File[]>([]);
  const { isUploading, progress, uploadFile } = useUploadFile({
    onUploadComplete: (files) => {
      setAssets((old) => [...files, ...old]);
      setSelected(files[0]);
    },
    onUploadError: (_, error, errorCode) => {
      if (errorCode === "asset_total_size_limit_reached") {
        toast.error(tAdmin("assets.toasts.assetTotalSizeLimitReached"));
      }
    },
    appointmentId: addTo?.appointmentId,
    customerId: addTo?.customerId,
  });

  const onSubmit = async () => {
    if (!fileToUpload) return;

    await uploadFile(
      fileToUpload.map((file) => ({ file, description: addTo?.description })),
    );
    setFileToUpload([]);
  };

  const disabled = loading || isUploading;
  const onClose = () => {
    if (!isUploading) close();
  };

  return (
    <Modal
      title={t("assetSelector.title")}
      isOpen={isOpen}
      onClose={onClose}
      className="sm:max-w-[80%]"
    >
      <div className="w-full mb-4">
        <Input
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <ScrollArea className="w-full max-h-[70svh]">
        <div className="flex flex-col gap-4">
          <div className="w-full flex flex-col gap-2 relative">
            <DndFileInput
              value={fileToUpload}
              onChange={setFileToUpload}
              disabled={disabled}
              maxFiles={10}
              accept={accept?.reduce(
                (map, cur) => ({
                  ...map,
                  [cur]: [],
                }),
                {} as Accept,
              )}
            />
            <Button
              variant="default"
              className="w-full"
              disabled={disabled || !fileToUpload}
              onClick={onSubmit}
            >
              {t("assetSelector.upload")}
            </Button>
            {isUploading && (
              <>
                <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center bg-white opacity-50">
                  <div role="status">
                    <Spinner className="w-10 h-10" />
                    <span className="sr-only">{t("loading.loading")}</span>
                  </div>
                </div>
                <Progress value={progress} />
              </>
            )}
          </div>
          {loading && page === 1 && <Loaders />}
          <div className="w-full" id="asset-scroll-area">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {assets?.map((asset) => (
                <div
                  tabIndex={0}
                  onClick={() => setSelected(asset)}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") && select(asset)
                  }
                  className={cn(
                    "border rounded-md flex flex-col gap-3 items-center justify-between cursor-pointer py-3",
                    selected?._id === asset._id ? "bg-accent" : "",
                  )}
                  key={asset._id}
                >
                  <AssetPreview asset={asset} />
                  <div className="flex flex-col gap-1 items-center text-center">
                    <span className="text-muted-foreground break-all">
                      {asset.description}
                    </span>
                    <span className="break-all">
                      {asset.filename?.substring(
                        asset.filename?.lastIndexOf("/") + 1,
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {hasMore && !loading && <div ref={ref} className="h-1" />}
          {loading && page > 1 && <Loaders />}
        </div>
      </ScrollArea>
      <div className="flex w-full items-center justify-end space-x-2 pt-6">
        <Button
          type="button"
          variant="secondary"
          disabled={isUploading}
          onClick={close}
        >
          {t("common.close")}
        </Button>
        <Button
          type="button"
          disabled={!selected || isUploading}
          onClick={selectAndClose}
        >
          {t("form.select")}
        </Button>
      </div>
    </Modal>
  );
};
