import { resolve } from "@hacado/utils";
import { Fragment, ReactNode } from "react";
import reactStringReplace from "react-string-replace";

export function formatJsx(
  template: string,
  args: Record<string, any | ReactNode>,
) {
  return reactStringReplace(
    template,
    /{{\s*([0-9A-Za-z_-]+)\s*}}/g,
    function (match, index) {
      const resolved = resolve(args, match);
      return (
        <Fragment key={index}>
          {typeof resolved != "undefined" ? resolved : match}
        </Fragment>
      );
    },
  );
}
