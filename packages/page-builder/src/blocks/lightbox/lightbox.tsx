"use client";
import { ReplaceOriginalColors } from "@hacado/page-builder-base";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Dialog,
  DialogContent,
} from "@hacado/ui";
import { useContext, useEffect, useState } from "react";
import { LightboxInternalContext } from "./context";
import { LightboxProps } from "./schema";

export const Lightbox = ({
  overlay,
  showAltAsDescription,
  navigation,
  loop,
  autoPlay,
}: Omit<LightboxProps["props"], "children">) => {
  const { isOpen, images, openId, onClose } = useContext(
    LightboxInternalContext,
  );
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api || !isOpen || !openId || !images) return;
    const index = images.findIndex((item) => item.id === openId);
    if (index < 0) return;

    api.scrollTo(index, true);
  }, [api, isOpen, openId, images]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
      modal
    >
      <DialogContent
        className="sm:max-w-[80%] flex flex-col max-h-lvh bg-transparent p-0 shadow-none border-0"
        overlayVariant={overlay}
        closeClassName="bg-background"
      >
        <ReplaceOriginalColors />

        <Carousel
          className="w-full"
          setApi={setApi}
          opts={{
            loop: !!loop,
            align: "start",
          }}
          autoPlay={autoPlay ? autoPlay * 1000 : undefined}
        >
          <CarouselContent>
            {images.map((file, index) => (
              <CarouselItem key={index}>
                <div className="flex flex-col gap-2 justify-center h-full max-h-lvh">
                  <div className="w-full flex justify-center max-h-[80%]">
                    <img
                      src={file.url}
                      className="w-full h-full object-contain"
                      alt={file.alt || ""}
                    />
                  </div>
                  {showAltAsDescription && file.alt && (
                    <div className="text-background text-center">
                      {file.alt}
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {navigation && (
            <>
              <CarouselPrevious className="left-0" />
              <CarouselNext className="right-0" />
            </>
          )}
        </Carousel>
      </DialogContent>
    </Dialog>
  );
};
