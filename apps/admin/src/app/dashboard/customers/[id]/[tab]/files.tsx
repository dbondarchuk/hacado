"use client";

import { Asset } from "@timelish/types";
import { useInView } from "react-intersection-observer";

import { AssetsTableAction } from "@/components/admin/assets/table/table-action";
import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import {
  Button,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DndFileInput,
  Progress,
  Skeleton,
  Spinner,
  Textarea,
  cn,
  toast,
  useUploadFile,
} from "@timelish/ui";
import {
  AssetPreview,
  useAuth,
  useSelectedRowsStore,
} from "@timelish/ui-admin";
import { hasPermission } from "@timelish/utils";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback } from "react";

const AssetItem: React.FC<{ asset: Asset; allowSelect?: boolean }> = ({
  asset,
  allowSelect = true,
}) => {
  const { rowSelection, setRowSelection } = useSelectedRowsStore();
  const setSelected = React.useCallback(() => {
    if (!allowSelect) return;
    const index = rowSelection.findIndex((row: Asset) => row._id === asset._id);
    const newRows = [...rowSelection];
    if (index >= 0) {
      newRows.splice(index, 1);
    } else {
      newRows.push(asset);
    }

    setRowSelection(newRows);
  }, [allowSelect, rowSelection, setRowSelection, asset]);

  const isSelected = !!rowSelection.find((row: Asset) => row._id === asset._id);
  return (
    <div
      tabIndex={allowSelect ? 0 : undefined}
      role={allowSelect ? "button" : undefined}
      onClick={allowSelect ? setSelected : undefined}
      className={cn(
        "border rounded-md flex flex-col gap-3 items-center justify-between py-3 relative",
        allowSelect ? "cursor-pointer" : "",
        isSelected ? "bg-accent" : "",
      )}
      key={asset._id}
    >
      {allowSelect ? (
        <Checkbox
          id={`asset-${asset._id}`}
          checked={isSelected}
          className="absolute top-1 left-1"
        />
      ) : null}
      <AssetPreview asset={asset} />
      <div className="flex flex-col gap-1 items-center text-center">
        <span className="text-muted-foreground">{asset.description}</span>
        <span>
          {asset.filename?.substring(asset.filename?.lastIndexOf("/") + 1)}
        </span>
      </div>
    </div>
  );
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
  <>
    <Loader />
    <Loader />
    <Loader className="max-lg:hidden" />
    <Loader className="max-xl:hidden" />
  </>
);

export const CustomerFilesTableAction: React.FC<{}> = () => {
  const router = useRouter();
  const { user } = useAuth();
  const canUpdate = hasPermission(user, "customer", "update");
  const onDelete = useCallback(() => {
    router.replace(`?key=${new Date().getTime()}`);
  }, [router]);

  return (
    <AssetsTableAction
      className="flex-1"
      onDelete={onDelete}
      allowDelete={canUpdate}
    />
  );
};

export const CustomerFileUpload: React.FC<{
  customerId: string;
}> = ({ customerId }) => {
  const t = useI18n("admin");
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const onUpload = () => {
    setDescription(undefined);
    setDisabled(false);
    setOpen(false);
    router.replace(`?key=${new Date().getTime()}`);
  };

  const [description, setDescription] = React.useState<string>();
  const [filesToUpload, setFilesToUpload] = React.useState<File[]>([]);
  const [disabled, setDisabled] = React.useState(false);
  const { isUploading, progress, uploadFile } = useUploadFile({
    onUploadComplete: () => {
      onUpload();
    },
    onUploadError: (_, error, errorCode) => {
      if (errorCode === "asset_total_size_limit_reached") {
        toast.error(t("assets.toasts.assetTotalSizeLimitReached"));
      }

      setDisabled(false);
    },
    customerId,
  });

  const onSubmit = async () => {
    if (!filesToUpload?.length) return;

    setDisabled(true);

    await uploadFile(filesToUpload.map((file) => ({ file, description })));
    setFilesToUpload([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" aria-label={t("common.buttons.addNew")}>
          <Upload />{" "}
          <span className="max-md:hidden">{t("common.buttons.addNew")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("customers.uploadFiles.title")}</DialogTitle>
          <DialogDescription>
            {t("customers.uploadFiles.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="w-full flex flex-col gap-2 relative">
          <DndFileInput
            value={filesToUpload}
            onChange={setFilesToUpload}
            disabled={disabled}
            maxFiles={10}
          />
          <Textarea
            className="w-full"
            autoResize
            placeholder={t("customers.uploadFiles.descriptionPlaceholder")}
            value={description ?? ""}
            onChange={(e) => setDescription(e.currentTarget.value)}
          />
          {isUploading && (
            <>
              <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center bg-white opacity-50">
                <div role="status">
                  <Spinner className="w-10 h-10" />
                  <span className="sr-only">Please wait...</span>
                </div>
              </div>
              <Progress value={progress} />
            </>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" disabled={disabled}>
              {t("common.buttons.close")}
            </Button>
          </DialogClose>
          <Button
            variant="default"
            disabled={disabled || !filesToUpload?.length || isUploading}
            onClick={onSubmit}
          >
            {t("customers.uploadFiles.upload")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const toLoad = 24; // divisible by 1, 2, 3

export const CustomerFiles: React.FC<{
  customerId: string;
  search: string | null;
}> = ({ customerId, search }) => {
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [initialLoad, setInitialLoad] = React.useState(true);
  const { user } = useAuth();
  const canUpdate = hasPermission(user, "customer", "update");
  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  const loadAssets = React.useCallback(
    async (page: number) => {
      const result = await adminApi.assets.getAssets({
        customerId: [customerId],
        search,
        page,
        limit: toLoad,
      });

      return {
        items: result.items,
        hasMore: page * toLoad < result.total,
      };
    },
    [customerId, search],
  );

  React.useEffect(() => {
    setPage(1);
    setHasMore(true);
    setInitialLoad(false);
    setAssets([]);
  }, [customerId, search]);

  React.useEffect(() => {
    const loadItems = async () => {
      if (!hasMore && !initialLoad) return;

      setLoading(true);
      try {
        const result = await loadAssets(page);

        if (page === 1) {
          setAssets(result.items);
        } else {
          setAssets((prev) => [...prev, ...result.items]);
        }

        setHasMore(result.hasMore);
        setInitialLoad(false);
      } catch (error) {
        console.error("Failed to fetch items:", error);
        toast.error("There was a problem with your request.");
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [page, loadAssets, initialLoad, hasMore]);

  React.useEffect(() => {
    if (inView && !loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [inView, loading, hasMore]);

  return (
    // <div className="flex flex-col gap-2 w-full">
    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
      {loading && page === 1 && <Loaders />}
      {assets?.map((asset) => (
        <AssetItem asset={asset} key={asset._id} allowSelect={canUpdate} />
      ))}
      {hasMore && !loading && <div ref={ref} className="h-1" />}
      {loading && page > 1 && <Loaders />}
    </div>
    // </div>
  );
};
