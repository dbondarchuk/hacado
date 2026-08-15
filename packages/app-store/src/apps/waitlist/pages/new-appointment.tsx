"use client";

import { Skeleton } from "@hacado/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { createSerializer, parseAsJson } from "nuqs/server";
import { useEffect } from "react";
import { getWaitlistEntry } from "../views/components/actions";

export const serialize = createSerializer({
  fromValue: parseAsJson((value) => value),
  data: parseAsJson((value) => value),
});

export const WaitlistNewAppointmentPage: React.FC<{ appId: string }> = ({
  appId,
}) => {
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");
  const router = useRouter();
  useEffect(() => {
    if (!id) {
      router.replace("/dashboard/waitlist");
      return;
    }

    const fn = async () => {
      const entry = await getWaitlistEntry(appId, id);
      if (!entry) {
        router.replace("/dashboard/waitlist");
        return;
      }

      const value = {
        optionId: entry.option._id,
        addonsIds: entry.addons?.map((addon) => addon._id),
        customerId: entry.customer._id,
        memberId: entry.memberId,
        fields: {
          name: entry.name,
          email: entry.email,
          phone: entry.phone,
        },
        totalDuration: entry.duration,
      };

      const serialized = serialize({
        fromValue: value,
        data: { waitlistId: id },
      });

      router.replace(`/dashboard/appointments/new${serialized}`);
    };

    fn();
  }, [id]);
  return <Skeleton className="w-full h-[70vh]" />;
};
