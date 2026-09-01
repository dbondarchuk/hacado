"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { PexelsMedia, UnsplashPhoto, UploadedFile } from "@hacado/types";
import {
  Button,
  cn,
  DndFileInput,
  Input,
  Modal,
  Progress,
  RadioButtonGroup,
  RadioButtonGroupItem,
  ScrollArea,
  Skeleton,
  Spinner,
  toast,
  useDebounce,
  useUploadFile,
} from "@hacado/ui";
import React from "react";
import { Accept } from "react-dropzone";
import { useInView } from "react-intersection-observer";
import { useMediaSources } from "../context/media-sources";
import { AssetPreview } from "./asset-preview";
import { PreviewVideo } from "./preview-video";

export type AssetSelectorProps = {
  accept?: string[];
  onSelected: (asset: UploadedFile) => void;
  isOpen: boolean;
  close: () => void;
  onlyAssets?: boolean;
  addTo?: {
    appointmentId?: string;
    customerId?: string;
    description?: string;
  };
};

type Source = "assets" | "unsplash" | "pexels";
type PexelsMediaType = "photo" | "video";

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

const imagesAllowed = (accept?: string[]) =>
  !accept?.length ||
  accept.some((a) => a === "*" || a === "image/*" || a.startsWith("image/"));

const videosAllowed = (accept?: string[]) =>
  !accept?.length ||
  accept.some((a) => a === "*" || a === "video/*" || a.startsWith("video/"));

const unsplashPhotoToUploadedFile = (photo: UnsplashPhoto): UploadedFile => ({
  _id: `unsplash:${photo.id}`,
  organizationId: "",
  filename: `unsplash/${photo.id}.jpg`,
  size: 0,
  mimeType: "image/jpeg",
  uploadedAt: new Date(),
  hash: "",
  description: photo.alt ?? photo.photographer.name,
  url: photo.urls.regular,
});

const pexelsMediaToUploadedFile = (media: PexelsMedia): UploadedFile => ({
  _id: `pexels:${media.type}:${media.id}`,
  organizationId: "",
  filename: `pexels/${media.id}${media.type === "video" ? ".mp4" : ".jpg"}`,
  size: 0,
  mimeType: media.mimeType,
  uploadedAt: new Date(),
  hash: "",
  description: media.alt ?? media.photographer.name,
  url: media.url,
});

const defaultPexelsType = (
  allowImages: boolean,
  allowVideos: boolean,
): PexelsMediaType => {
  if (allowVideos && !allowImages) return "video";
  return "photo";
};

export const AssetSelectorDialog: React.FC<AssetSelectorProps> = ({
  accept,
  onSelected,
  close,
  isOpen,
  addTo,
  onlyAssets,
}) => {
  const t = useI18n("ui");
  const tAdmin = useI18n("admin");
  const mediaSources = useMediaSources();

  const allowImages = imagesAllowed(accept);
  const allowVideos = videosAllowed(accept);
  const showUnsplash = !onlyAssets && allowImages && mediaSources.unsplash;
  const showPexels =
    !onlyAssets && mediaSources.pexels && (allowImages || allowVideos);
  const showStockSources = showUnsplash || showPexels;
  const pexelsNeedsTypeToggle = showPexels && allowImages && allowVideos;

  const [source, setSource] = React.useState<Source>("assets");
  const [pexelsType, setPexelsType] = React.useState<PexelsMediaType>(
    defaultPexelsType(allowImages, allowVideos),
  );
  const [selected, setSelected] = React.useState<UploadedFile | undefined>(
    undefined,
  );
  const [selectedUnsplash, setSelectedUnsplash] = React.useState<
    UnsplashPhoto | undefined
  >(undefined);
  const [selectedPexels, setSelectedPexels] = React.useState<
    PexelsMedia | undefined
  >(undefined);

  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [assets, setAssets] = React.useState<UploadedFile[]>([]);
  const [unsplashPhotos, setUnsplashPhotos] = React.useState<UnsplashPhoto[]>(
    [],
  );
  const [pexelsItems, setPexelsItems] = React.useState<PexelsMedia[]>([]);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [initialLoad, setInitialLoad] = React.useState(true);
  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  React.useEffect(() => {
    setAssets([]);
    setUnsplashPhotos([]);
    setPexelsItems([]);
    setPage(1);
    setHasMore(true);
    setSelected(undefined);
    setSelectedUnsplash(undefined);
    setSelectedPexels(undefined);
  }, [debouncedSearch, source, pexelsType]);

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

  const loadUnsplash = React.useCallback(
    async (page: number, search?: string) => {
      const result = await adminApi.unsplash.searchUnsplashPhotos({
        page,
        limit: toLoad,
        query: search || undefined,
      });

      return {
        items: result.items,
        hasMore: page * toLoad < result.total,
      };
    },
    [],
  );

  const loadPexels = React.useCallback(
    async (page: number, search?: string, type: PexelsMediaType = "photo") => {
      const result = await adminApi.pexels.searchPexelsMedia({
        page,
        limit: toLoad,
        query: search || undefined,
        type,
      });

      return {
        items: result.items,
        hasMore: page * toLoad < result.total,
      };
    },
    [],
  );

  React.useEffect(() => {
    const loadItems = async () => {
      if (!hasMore && !initialLoad) return;

      setLoading(true);
      try {
        if (source === "assets") {
          const result = await loadAssets(page, debouncedSearch);
          if (page === 1) {
            setAssets(result.items);
          } else {
            setAssets((prev) => [...prev, ...result.items]);
          }
          setHasMore(result.hasMore);
        } else if (source === "unsplash") {
          const result = await loadUnsplash(page, debouncedSearch);
          if (page === 1) {
            setUnsplashPhotos(result.items);
          } else {
            setUnsplashPhotos((prev) => [...prev, ...result.items]);
          }
          setHasMore(result.hasMore);
        } else {
          const result = await loadPexels(page, debouncedSearch, pexelsType);
          if (page === 1) {
            setPexelsItems(result.items);
          } else {
            setPexelsItems((prev) => [...prev, ...result.items]);
          }
          setHasMore(result.hasMore);
        }
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
  }, [
    debouncedSearch,
    page,
    loadAssets,
    loadUnsplash,
    loadPexels,
    initialLoad,
    hasMore,
    isOpen,
    source,
    pexelsType,
    t,
  ]);

  React.useEffect(() => {
    if (isOpen && inView && !loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [inView, loading, hasMore, isOpen]);

  const select = (asset: UploadedFile) => {
    setSelected(selected?._id === asset._id ? undefined : asset);
    setSelectedUnsplash(undefined);
    setSelectedPexels(undefined);
  };

  const selectUnsplash = (photo: UnsplashPhoto) => {
    setSelectedUnsplash(selectedUnsplash?.id === photo.id ? undefined : photo);
    setSelected(undefined);
    setSelectedPexels(undefined);
  };

  const selectPexels = (media: PexelsMedia) => {
    setSelectedPexels(selectedPexels?.id === media.id ? undefined : media);
    setSelected(undefined);
    setSelectedUnsplash(undefined);
  };

  const selectAndClose = async () => {
    if (source === "unsplash") {
      if (!selectedUnsplash) return;

      try {
        await adminApi.unsplash.trackUnsplashDownload(
          selectedUnsplash.downloadLocation,
        );
      } catch (error) {
        console.error("Failed to track Unsplash download:", error);
      }

      onSelected(unsplashPhotoToUploadedFile(selectedUnsplash));
      close();
      return;
    }

    if (source === "pexels") {
      if (!selectedPexels) return;
      onSelected(pexelsMediaToUploadedFile(selectedPexels));
      close();
      return;
    }

    if (!selected) return;
    onSelected(selected);
    close();
  };

  React.useEffect(() => {
    setSelected(undefined);
    setSelectedUnsplash(undefined);
    setSelectedPexels(undefined);
    if (!isOpen) {
      setInitialLoad(false);
      setPage(1);
      setHasMore(true);
      setAssets([]);
      setUnsplashPhotos([]);
      setPexelsItems([]);
      setSearch("");
      setSource("assets");
      setPexelsType(defaultPexelsType(allowImages, allowVideos));
    }
  }, [isOpen, allowImages, allowVideos]);

  React.useEffect(() => {
    if (
      (source === "unsplash" && !showUnsplash) ||
      (source === "pexels" && !showPexels)
    ) {
      setSource("assets");
    }
  }, [showUnsplash, showPexels, source]);

  React.useEffect(() => {
    if (!pexelsNeedsTypeToggle) {
      setPexelsType(defaultPexelsType(allowImages, allowVideos));
    }
  }, [pexelsNeedsTypeToggle, allowImages, allowVideos]);

  const [fileToUpload, setFileToUpload] = React.useState<File[]>([]);
  const { isUploading, progress, uploadFile } = useUploadFile({
    onUploadComplete: (files) => {
      setAssets((old) => [...files, ...old]);
      setSelected(files[0]);
      setSelectedUnsplash(undefined);
      setSelectedPexels(undefined);
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

  const canConfirm =
    source === "unsplash"
      ? !!selectedUnsplash
      : source === "pexels"
        ? !!selectedPexels
        : !!selected;

  const searchPlaceholder =
    source === "unsplash"
      ? t("assetSelector.unsplashSearch")
      : source === "pexels"
        ? t("assetSelector.pexelsSearch")
        : t("common.search");

  return (
    <Modal
      title={t("assetSelector.title")}
      isOpen={isOpen}
      onClose={onClose}
      className="sm:max-w-[80%]"
    >
      {showStockSources && (
        <div className="w-full mb-4 flex flex-wrap gap-3">
          <RadioButtonGroup
            value={source}
            onValueChange={(value) => {
              if (
                value === "assets" ||
                value === "unsplash" ||
                value === "pexels"
              ) {
                setSource(value);
              }
            }}
          >
            <RadioButtonGroupItem value="assets" size="sm">
              {t("assetSelector.assets")}
            </RadioButtonGroupItem>
            {showUnsplash && (
              <RadioButtonGroupItem value="unsplash" size="sm">
                {t("assetSelector.unsplash")}
              </RadioButtonGroupItem>
            )}
            {showPexels && (
              <RadioButtonGroupItem value="pexels" size="sm">
                {t("assetSelector.pexels")}
              </RadioButtonGroupItem>
            )}
          </RadioButtonGroup>
          {source === "pexels" && pexelsNeedsTypeToggle && (
            <RadioButtonGroup
              value={pexelsType}
              onValueChange={(value) => {
                if (value === "photo" || value === "video") {
                  setPexelsType(value);
                }
              }}
            >
              <RadioButtonGroupItem value="photo" size="sm">
                {t("assetSelector.photos")}
              </RadioButtonGroupItem>
              <RadioButtonGroupItem value="video" size="sm">
                {t("assetSelector.videos")}
              </RadioButtonGroupItem>
            </RadioButtonGroup>
          )}
        </div>
      )}
      <div className="w-full mb-4">
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <ScrollArea className="w-full max-h-[70svh]">
        <div className="flex flex-col gap-4">
          {source === "assets" && (
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
          )}
          {loading && page === 1 && <Loaders />}
          <div className="w-full" id="asset-scroll-area">
            {source === "assets" && (
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
                    {asset.mimeType.startsWith("video/") ? (
                      <PreviewVideo
                        src={asset.url}
                        active={selected?._id === asset._id}
                        alt={asset.description}
                        className="px-2"
                      />
                    ) : (
                      <AssetPreview asset={asset} />
                    )}
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
            )}
            {source === "unsplash" && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {unsplashPhotos.map((photo) => (
                  <div
                    tabIndex={0}
                    onClick={() => selectUnsplash(photo)}
                    onKeyDown={(e) =>
                      (e.key === "Enter" || e.key === " ") &&
                      selectUnsplash(photo)
                    }
                    className={cn(
                      "border rounded-md flex flex-col gap-3 items-center justify-between cursor-pointer py-3 px-2",
                      selectedUnsplash?.id === photo.id ? "bg-accent" : "",
                    )}
                    key={photo.id}
                  >
                    <img
                      src={photo.urls.small}
                      alt={photo.alt ?? photo.photographer.name}
                      className="w-full h-32 object-cover rounded"
                    />
                    <div className="flex flex-col gap-1 items-center text-center text-xs">
                      <span className="text-muted-foreground">
                        {t("assetSelector.photoBy")}{" "}
                        <a
                          href={photo.photographer.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {photo.photographer.name}
                        </a>{" "}
                        {t("assetSelector.on")}{" "}
                        <a
                          href={photo.unsplashUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Unsplash
                        </a>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {source === "pexels" && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pexelsItems.map((media) => (
                  <div
                    tabIndex={0}
                    onClick={() => selectPexels(media)}
                    onKeyDown={(e) =>
                      (e.key === "Enter" || e.key === " ") &&
                      selectPexels(media)
                    }
                    className={cn(
                      "border rounded-md flex flex-col gap-3 items-center justify-between cursor-pointer py-3 px-2",
                      selectedPexels?.id === media.id ? "bg-accent" : "",
                    )}
                    key={`${media.type}-${media.id}`}
                  >
                    {media.type === "video" ? (
                      <PreviewVideo
                        src={media.url}
                        poster={media.previewUrl}
                        active={selectedPexels?.id === media.id}
                        alt={media.alt ?? media.photographer.name}
                      />
                    ) : (
                      <img
                        src={media.previewUrl}
                        alt={media.alt ?? media.photographer.name}
                        className="w-full h-32 object-cover rounded"
                      />
                    )}
                    <div className="flex flex-col gap-1 items-center text-center text-xs">
                      <span className="text-muted-foreground">
                        {media.type === "video"
                          ? t("assetSelector.videoBy")
                          : t("assetSelector.photoBy")}{" "}
                        <a
                          href={media.photographer.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {media.photographer.name}
                        </a>{" "}
                        {t("assetSelector.on")}{" "}
                        <a
                          href={media.pexelsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Pexels
                        </a>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading &&
              source === "unsplash" &&
              unsplashPhotos.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  {t("assetSelector.unsplashEmpty")}
                </p>
              )}
            {!loading && source === "pexels" && pexelsItems.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {t("assetSelector.pexelsEmpty")}
              </p>
            )}
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
          disabled={!canConfirm || isUploading}
          onClick={selectAndClose}
        >
          {t("form.select")}
        </Button>
      </div>
    </Modal>
  );
};
