import { EditorDocumentBlocksDictionary } from "@timelish/builder";
import { AllKeys, BuilderKeys } from "@timelish/i18n";
import { CalendarClock, CalendarFold } from "lucide-react";
import {
  WaitlistAdminKeys,
  WaitlistAdminNamespace,
} from "../translations/types";
import { BookingWithWaitlistConfiguration as ModernBookingWithWaitlistConfiguration } from "./modern/booking-with-waitlist/configuration";
import { BookingWithWaitlistEditor as ModernBookingWithWaitlistEditor } from "./modern/booking-with-waitlist/editor";
import {
  BookingWithWaitlistPropsDefaults as ModernBookingWithWaitlistPropsDefaults,
  BookingWithWaitlistPropsSchema as ModernBookingWithWaitlistPropsSchema,
} from "./modern/booking-with-waitlist/schema";
import { BookingWithWaitlistToolbar as ModernBookingWithWaitlistToolbar } from "./modern/booking-with-waitlist/toolbar";
import { WaitlistConfiguration as ModernWaitlistConfiguration } from "./modern/waitlist/configuration";
import { WaitlistEditor as ModernWaitlistEditor } from "./modern/waitlist/editor";
import {
  WaitlistPropsDefaults as ModernWaitlistPropsDefaults,
  WaitlistPropsSchema as ModernWaitlistPropsSchema,
} from "./modern/waitlist/schema";
import { WaitlistToolbar as ModernWaitlistToolbar } from "./modern/waitlist/toolbar";
import { BookingWithWaitlistConfiguration as SimpleBookingWithWaitlistConfiguration } from "./simple/booking-with-waitlist/configuration";
import { BookingWithWaitlistEditor as SimpleBookingWithWaitlistEditor } from "./simple/booking-with-waitlist/editor";
import {
  BookingWithWaitlistPropsDefaults as SimpleBookingWithWaitlistPropsDefaults,
  BookingWithWaitlistPropsSchema as SimpleBookingWithWaitlistPropsSchema,
} from "./simple/booking-with-waitlist/schema";
import { BookingWithWaitlistToolbar as SimpleBookingWithWaitlistToolbar } from "./simple/booking-with-waitlist/toolbar";
import { WaitlistConfiguration as SimpleWaitlistConfiguration } from "./simple/waitlist/configuration";
import { WaitlistEditor as SimpleWaitlistEditor } from "./simple/waitlist/editor";
import {
  WaitlistPropsDefaults as SimpleWaitlistPropsDefaults,
  WaitlistPropsSchema as SimpleWaitlistPropsSchema,
} from "./simple/waitlist/schema";
import { WaitlistToolbar as SimpleWaitlistToolbar } from "./simple/waitlist/toolbar";

export const WaitlistBlocksSchema = {
  WaitlistModern: ModernWaitlistPropsSchema,
  BookingModern: ModernBookingWithWaitlistPropsSchema,
  WaitlistSimple: SimpleWaitlistPropsSchema,
  BookingSimple: SimpleBookingWithWaitlistPropsSchema,
};

export const WaitlistBlocksAllowedInFooter = {
  WaitlistModern: false,
  BookingModern: false,
  WaitlistSimple: false,
  BookingSimple: false,
};

export const WaitlistBlocksDefaultMetadata = (
  appName: string,
  appId: string,
) => ({
  waitlistAppId: appId,
});

export const WaitlistEditors: EditorDocumentBlocksDictionary<
  typeof WaitlistBlocksSchema
> = {
  WaitlistModern: {
    displayName:
      "app_waitlist_admin.block.modern.waitlist.displayName" satisfies AllKeys<
        WaitlistAdminNamespace,
        WaitlistAdminKeys
      >,
    icon: <CalendarClock className="text-primary" />,
    Editor: ModernWaitlistEditor,
    Configuration: ModernWaitlistConfiguration,
    Toolbar: ModernWaitlistToolbar,
    defaultValue: ModernWaitlistPropsDefaults,
    category: "builder.pageBuilder.blocks.categories.booking" satisfies AllKeys<
      "builder",
      BuilderKeys
    >,
    capabilities: ["booking", "waitlist", "block"],
    tags: ["booking", "waitlist"],
  },
  BookingModern: {
    displayName:
      "app_waitlist_admin.block.modern.bookingWithWaitlist.displayName" satisfies AllKeys<
        WaitlistAdminNamespace,
        WaitlistAdminKeys
      >,
    icon: <CalendarFold className="text-primary" />,
    Editor: ModernBookingWithWaitlistEditor,
    Configuration: ModernBookingWithWaitlistConfiguration,
    Toolbar: ModernBookingWithWaitlistToolbar,
    defaultValue: ModernBookingWithWaitlistPropsDefaults,
    category: "builder.pageBuilder.blocks.categories.booking" satisfies AllKeys<
      "builder",
      BuilderKeys
    >,
    capabilities: ["booking", "waitlist", "block"],
    tags: ["booking", "waitlist"],
  },
  WaitlistSimple: {
    displayName:
      "app_waitlist_admin.block.simple.waitlist.displayName" satisfies AllKeys<
        WaitlistAdminNamespace,
        WaitlistAdminKeys
      >,
    icon: <CalendarClock />,
    Editor: SimpleWaitlistEditor,
    Configuration: SimpleWaitlistConfiguration,
    Toolbar: SimpleWaitlistToolbar,
    defaultValue: SimpleWaitlistPropsDefaults,
    category: "builder.pageBuilder.blocks.categories.booking" satisfies AllKeys<
      "builder",
      BuilderKeys
    >,
    capabilities: ["booking", "waitlist", "block"],
    tags: ["booking", "waitlist"],
  },
  BookingSimple: {
    displayName:
      "app_waitlist_admin.block.simple.bookingWithWaitlist.displayName" satisfies AllKeys<
        WaitlistAdminNamespace,
        WaitlistAdminKeys
      >,
    icon: <CalendarFold />,
    Editor: SimpleBookingWithWaitlistEditor,
    Configuration: SimpleBookingWithWaitlistConfiguration,
    Toolbar: SimpleBookingWithWaitlistToolbar,
    defaultValue: SimpleBookingWithWaitlistPropsDefaults,
    category: "builder.pageBuilder.blocks.categories.booking" satisfies AllKeys<
      "builder",
      BuilderKeys
    >,
    capabilities: ["booking", "waitlist", "block"],
    tags: ["booking", "waitlist"],
  },
};

export const WaitlistBlocks: Record<
  string,
  {
    schema: (typeof WaitlistBlocksSchema)[keyof typeof WaitlistBlocksSchema];
    editor: EditorDocumentBlocksDictionary<
      typeof WaitlistBlocksSchema
    >[keyof typeof WaitlistBlocksSchema];
    defaultMetadata: (
      appName: string,
      appId: string,
    ) => Record<string, unknown>;
    allowedInFooter: boolean;
  }
> = Object.fromEntries(
  Object.entries(WaitlistBlocksSchema).map(([key, schema]) => [
    key,
    {
      schema,
      editor: WaitlistEditors[key as keyof typeof WaitlistBlocksSchema],
      defaultMetadata: WaitlistBlocksDefaultMetadata,
      allowedInFooter:
        WaitlistBlocksAllowedInFooter[key as keyof typeof WaitlistBlocksSchema],
    },
  ]),
);
