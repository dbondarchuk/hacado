"use client";

import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@hacado/ui";
import { ChevronsUpDown } from "lucide-react";
import React from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  const [isOpen, setIsOpen] = React.useState(false);

  let message: string;
  if (typeof error === "string") message = error;
  else if ("message" in error) message = error.message;
  else message = JSON.stringify(error);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-[350px] space-y-2"
      >
        <div className="flex items-center justify-between space-x-4 px-4">
          <CollapsibleTrigger asChild>
            <Button variant="destructive" size="sm" className="w-full">
              <span className="font-semibold">Show error</span>
              <ChevronsUpDown className="h-4 w-4" />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="space-y-2 text-destructive">
          {message}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
