import React from 'react';
import { MultiToggleValues, TriState } from '@tiyo/common';
import { Popover, PopoverContent, PopoverTrigger } from '@houdoku/ui/components/Popover';
import { Button } from '@houdoku/ui/components/Button';
import { CheckIcon, ChevronDown, XIcon } from 'lucide-react';
import { Badge } from '@houdoku/ui/components/Badge';

type Props = {
  label: string;
  canExclude?: boolean;
  fields: { key: string; label: string }[];
  values: MultiToggleValues;
  onChange: (toggleValues: MultiToggleValues) => void;
};

const SearchFilterMultiToggle: React.FC<Props> = (props) => {
  const setValue = (key: string, value: TriState) => {
    const next = { ...props.values };
    if (value === TriState.IGNORE) delete next[key];
    else next[key] = value;
    props.onChange(next);
  };
  const numNonIgnored = Object.values(props.values).filter(
    (value) => value !== TriState.IGNORE,
  ).length;
  const labels = {
    [TriState.IGNORE]: 'Ignored',
    [TriState.INCLUDE]: 'Included',
    [TriState.EXCLUDE]: 'Excluded',
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between" aria-label={props.label}>
          <span className="flex items-center gap-2">
            {numNonIgnored > 0 && <Badge>{numNonIgnored}</Badge>}
            {props.label}
          </span>
          <ChevronDown className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <p className="px-2 py-2 text-caption text-muted-foreground">
          {props.canExclude
            ? 'Click to include, exclude, or clear a tag.'
            : 'Click to include or clear a tag.'}
        </p>
        <div className="max-h-64 overflow-y-auto">
          {props.fields.map((field) => {
            const value = props.values[field.key] ?? TriState.IGNORE;
            const next =
              value === TriState.IGNORE
                ? TriState.INCLUDE
                : value === TriState.INCLUDE && props.canExclude
                  ? TriState.EXCLUDE
                  : TriState.IGNORE;
            return (
              <Button
                key={field.key}
                variant="ghost"
                className="w-full justify-start"
                aria-label={`${field.label}: ${labels[value]}`}
                onClick={() => setValue(field.key, next)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  setValue(field.key, TriState.IGNORE);
                }}
              >
                {value === TriState.INCLUDE ? (
                  <CheckIcon />
                ) : value === TriState.EXCLUDE ? (
                  <XIcon />
                ) : (
                  <span className="size-4" />
                )}
                <span>{field.label}</span>
                <span className="ml-auto text-caption text-muted-foreground">{labels[value]}</span>
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
export default SearchFilterMultiToggle;
