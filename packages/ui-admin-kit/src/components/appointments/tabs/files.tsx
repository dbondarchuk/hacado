"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { Appointment, AssetEntity } from "@hacado/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Dialog,
  DialogContent,
  DndFileInput,
  Spinner,
  toast,
  toastPromise,
  useUploadFile,
} from "@hacado/ui";
import { canUpdateAppointment, mimeTypeToExtension } from "@hacado/utils";
import { FileIcon, Trash } from "lucide-react";
// import Image from "next/image";
import { useAuth } from "@hacado/ui-admin";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DefaultExtensionType, defaultStyles } from "react-file-icon";

type AppointmentFilesProps = {
  appointment: Appointment;
};

export const AppointmentFiles = ({ appointment }: AppointmentFilesProps) => {
  const t = useI18n("admin");
  const router = useRouter();
  const { user } = useAuth();
  const canUpdate = canUpdateAppointment(user, appointment.memberId);

  const [loading, setLoading] = useState(false);

  const onRemoveAppointmentFile = useCallback(
    async (fileId: string) => {
      if (!canUpdate) return;
      try {
        setLoading(true);
        await toastPromise(adminApi.assets.deleteAsset(fileId), {
          success: t("appointments.view.changesSaved"),
          error: t("appointments.view.requestError"),
        });

        const fileIndex =
          appointment.files?.findIndex((file) => file._id === fileId) ?? -1;
        if (fileIndex >= 0) {
          appointment.files?.splice(fileIndex, 1);
        }

        router.refresh();
      } catch (error: any) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [appointment, canUpdate, router, setLoading, t],
  );

  const galleryItems =
    appointment.files?.filter((file) => file.mimeType?.startsWith("image/")) ||
    [];

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | undefined>();
  const [api, setApi] = useState<CarouselApi>();

  const onFileClick = (fileId: string) => {
    setSelectedFile(fileId);
    setGalleryOpen(true);
  };

  useEffect(() => {
    if (!api || !selectedFile || !galleryOpen) return;
    const index = galleryItems.findIndex((item) => item._id === selectedFile);
    if (index < 0) return;

    api.scrollTo(index, true);
  }, [api, selectedFile, galleryOpen]);

  const onGalleryOpenChange = (open: boolean) => {
    if (!open) setSelectedFile(undefined);
    setGalleryOpen(open);
  };

  const onAssetAdded = (asset: AssetEntity) => {
    if (!appointment.files) {
      appointment.files = [];
    }

    appointment.files.push(asset);
    router.refresh();
  };

  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const { isUploading, progress, uploadFile, uploadingFiles } = useUploadFile({
    appointmentId: appointment._id,
    onFileUploaded: (file) => {
      onAssetAdded(file);
    },
    onUploadError: (_, error, errorCode) => {
      if (errorCode === "asset_total_size_limit_reached") {
        toast.error(t("assets.toasts.assetTotalSizeLimitReached"));
      }
    },
  });

  const onClickUpload = useCallback(async () => {
    if (!filesToUpload?.length) return;

    await uploadFile(filesToUpload.map((file) => ({ file })));

    setFilesToUpload([]);
  }, [filesToUpload, uploadFile]);

  return (
    <div className="flex flex-col gap-2 @container/files">
      {canUpdate ? (
        <div className="w-full flex flex-col gap-2">
          <DndFileInput
            name="files"
            disabled={loading}
            maxFiles={10}
            value={filesToUpload}
            onChange={setFilesToUpload}
          />
          <Button
            variant="default"
            className="w-full"
            onClick={onClickUpload}
            disabled={loading || isUploading || !filesToUpload?.length}
          >
            {t("appointments.view.upload")}
          </Button>
        </div>
      ) : null}
      <div className="grid grid-cols-1 @md/files:grid-cols-2 @lg/files:grid-cols-3 @xl/files:grid-cols-4 gap-2">
        {uploadingFiles.length > 0 && (
          <div className="w-full relative flex justify-center">
            {uploadingFiles.map((file) => (
              <>
                {file.type.startsWith("image/") ? (
                  <div className="relative w-20 h-20" key={file.name}>
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full object-contain h-full"
                    />
                  </div>
                ) : (
                  <div
                    className="flex flex-col gap-2 text-base justify-center"
                    key={file.name}
                  >
                    <div className="max-w-10 flex self-center">
                      <FileIcon
                        extension={file.name.substring(
                          file.name.lastIndexOf(".") + 1,
                        )}
                        {...defaultStyles[
                          mimeTypeToExtension(file.type) as DefaultExtensionType
                        ]}
                      />
                    </div>
                    <div className="text-muted-foreground text-center">
                      {file.name}
                    </div>
                  </div>
                )}
              </>
            ))}
            <div className="absolute top-0 bottom-0 right-0 left-0 bg-background/50 flex items-center flex-col gap-2 justify-center">
              <Spinner className="w-5 h-5" />
              <span className="text-base">{progress}%</span>
            </div>
          </div>
        )}
        {appointment.files?.map((file) => (
          <div className="w-full relative flex justify-center" key={file._id}>
            {canUpdate ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={loading}
                    variant="ghost"
                    className="absolute -right-1 -top-1 text-destructive hover:bg-destructive hover:text-destructive-foreground z-[3]"
                    size="icon"
                    type="button"
                    title={t("appointments.view.removeAppointmentFile")}
                  >
                    <Trash size={16} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("appointments.view.confirmTitle")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("appointments.view.confirmRemoveFile")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {t("appointments.view.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction variant="destructive" asChild>
                      <Button onClick={() => onRemoveAppointmentFile(file._id)}>
                        {t("appointments.view.delete")}
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
            {file.mimeType?.startsWith("image/") ? (
              <div className="relative w-20 h-20">
                <img
                  src={`/assets/${file.filename}`}
                  // fill
                  alt={file.description || file.filename}
                  className="cursor-pointer object-cover"
                  onClick={() => onFileClick(file._id)}
                />
              </div>
            ) : (
              <a
                className="flex flex-col gap-2 text-base justify-center"
                href={`/assets/${file.filename}`}
                target="_blank"
              >
                <div className="max-w-10 flex self-center">
                  <FileIcon
                    extension={file.filename?.substring(
                      file.filename.lastIndexOf(".") + 1,
                    )}
                    {...defaultStyles[
                      mimeTypeToExtension(file.mimeType) as DefaultExtensionType
                    ]}
                  />
                </div>
                <div className="text-muted-foreground text-center">
                  {file.filename.substring(file.filename.lastIndexOf("/") + 1)}
                </div>
              </a>
            )}
          </div>
        ))}
        <Dialog open={galleryOpen} onOpenChange={onGalleryOpenChange} modal>
          <DialogContent
            className="sm:max-w-[80%] flex flex-col max-h-lvh bg-transparent p-0 shadow-none border-0"
            overlayVariant="blur"
            closeClassName="bg-background"
          >
            <Carousel className="w-full" setApi={setApi}>
              <CarouselContent>
                {galleryItems.map((file, index) => (
                  <CarouselItem key={`${file._id}-${index}`}>
                    <div className="flex flex-col gap-2 justify-center h-full max-h-lvh">
                      <div className="w-full flex justify-center max-h-[80%]">
                        <img
                          src={`/assets/${file.filename}`}
                          width={800}
                          height={800}
                          className="object-contain"
                          alt={file.description || file.filename}
                        />
                      </div>
                      <div className="text-background text-center">
                        {file.description || " "}
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0" />
              <CarouselNext className="right-0" />
            </Carousel>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
