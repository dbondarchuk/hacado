"use client";
import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { CommunicationChannel, communicationChannels } from "@timelish/types";
import {
  Button,
  Combobox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@timelish/ui";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";

export const AddNewTemplateButton: React.FC = () => {
  const t = useI18n("admin");
  const [type, setType] = React.useState<CommunicationChannel>("email");
  const [template, setTemplate] = React.useState<string>("");
  const [availableTemplates, setAvailableTemplates] = React.useState<
    { id: string; name: string; type: CommunicationChannel }[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const availableTemplatesValues = useMemo(
    () => [
      {
        label: t("templates.addNew.emptyTemplate"),
        value: "",
      },
      ...availableTemplates.map((template) => ({
        label: template.name,
        value: template.id,
      })),
    ],
    [t, availableTemplates],
  );

  const fetchAvailableTemplates = async (type: CommunicationChannel) => {
    setIsLoading(true);
    const templates = await adminApi.templates.getTemplateTemplates(type);
    setAvailableTemplates(templates);
    setIsLoading(false);
  };

  const handleTypeChange = (value: CommunicationChannel) => {
    setType(value);
    setTemplate("");
    fetchAvailableTemplates(value);
  };

  const onOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setAvailableTemplates([]);
      setTemplate("");
    } else {
      fetchAvailableTemplates(type);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Plus />{" "}
          <span className="md:hidden">{t("templates.addNew.add")}</span>
          <span className="hidden md:inline">
            {t("templates.addNew.addNewTemplate")}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full sm:max-w-96" overlayVariant="blur">
        <DialogHeader className="px-1">
          <DialogTitle>{t("templates.addNew.addNewTemplate")}</DialogTitle>
        </DialogHeader>
        <div className="w-full  px-1 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{t("templates.addNew.type")}</Label>
            <div className="flex w-full">
              <Select value={type} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t("templates.addNew.selectTemplateType")}
                  />
                </SelectTrigger>
                <SelectContent side="bottom">
                  {communicationChannels.map((channel) => (
                    <SelectItem key={channel} value={channel}>
                      {t(`common.labels.channel.${channel}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("templates.addNew.template")}</Label>
            <div className="flex w-full">
              <Combobox
                values={availableTemplatesValues}
                value={template}
                onItemSelect={setTemplate}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="px-1">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              {t("templates.addNew.close")}
            </Button>
          </DialogClose>
          <Button
            variant="default"
            disabled={!type || isLoading || !template}
            onClick={() => {
              router.push(
                `/dashboard/templates/new/${type}${template ? `?templateId=${encodeURIComponent(template)}` : ""}`,
              );
            }}
          >
            {t("templates.addNew.addNewTemplate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
