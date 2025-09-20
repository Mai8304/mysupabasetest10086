import * as React from "react";

import { cn } from "@/lib/utils";

type SeparatorProps = React.ComponentPropsWithoutRef<"div"> & {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
};

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>((
  { className, orientation = "horizontal", decorative = true, ...props },
  ref,
) => {
  const dataOrientation = orientation === "vertical" ? "vertical" : "horizontal";

  return (
    <div
      ref={ref}
      role={decorative ? "none" : "separator"}
      data-orientation={dataOrientation}
      className={cn(
        "shrink-0 bg-border",
        dataOrientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
});
Separator.displayName = "Separator";

export { Separator };
