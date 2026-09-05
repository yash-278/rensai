import { useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './Tooltip';

/** Keep instructions available after an input's placeholder disappears. */
export function FieldHelp({
  label,
  text,
  descriptionId,
}: {
  label: string;
  text: string;
  descriptionId: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <span id={descriptionId} className="sr-only">
        {text}
      </span>
      <TooltipProvider delayDuration={250}>
        <Tooltip open={open} onOpenChange={setOpen}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`Help for ${label}`}
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-control text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={(event) => {
                event.preventDefault();
                setOpen(true);
              }}
            >
              <CircleHelp className="size-4" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="start"
            collisionPadding={16}
            className="max-w-[min(20rem,calc(100vw-2rem))] whitespace-pre-line break-words border bg-popover p-3 text-body leading-normal text-popover-foreground shadow-md"
          >
            {text}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
}
