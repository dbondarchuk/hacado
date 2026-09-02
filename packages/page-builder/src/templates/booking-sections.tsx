import { generateId, TemplatesConfiguration } from "@hacado/builder";
import type { BaseAllKeys } from "@hacado/i18n";
import { CalendarCheck } from "lucide-react";
import { BookingPropsDefaults } from "../blocks/booking/modern/schema";
import { bodyText, titleHeading } from "./fluid-helpers";
import { sectionTemplatePreviewPath } from "./preview-manifest";
import {
  compositeContainer,
  sectionShell,
  splitColumns,
} from "./section-helpers";

const category =
  "builder.pageBuilder.blocks.categories.booking" satisfies BaseAllKeys;

const prefix = "builder.pageBuilder.sectionDefaults.booking";

export const bookingSectionEditorTemplates: TemplatesConfiguration = {
  BookingSection: {
    displayName:
      "builder.pageBuilder.templates.booking.bookingSection" satisfies BaseAllKeys,
    icon: <CalendarCheck />,
    category,
    previewImage: sectionTemplatePreviewPath("booking-section.png"),
    getBlock: (t) => {
      const copy = compositeContainer(
        [
          titleHeading(t, `${prefix}.bookingSection.title` as BaseAllKeys, {
            level: "h2",
            textAlign: "center",
          }),
          bodyText(t, `${prefix}.bookingSection.body` as BaseAllKeys, {
            textAlign: "center",
          }),
        ],
        1,
      );
      const booking = {
        type: "BookingModern" as const,
        id: generateId(),
        data: BookingPropsDefaults,
      };
      return sectionShell([splitColumns(copy, booking)]);
    },
  },
};
