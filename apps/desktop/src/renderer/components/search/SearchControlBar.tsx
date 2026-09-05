import React, { useState } from 'react';
import { ExtensionMetadata } from '@tiyo/common';
import { useRecoilState } from 'recoil';
const { ipcRenderer } = require('electron');
import {
  searchExtensionState,
  searchTextState,
  showingFilterDrawerState,
} from '@/renderer/state/searchStates';
import { FS_METADATA } from '@/common/temp_fs_metadata';
import ipcChannels from '@/common/constants/ipcChannels.json';
import { Button } from '@houdoku/ui/components/Button';
import { FolderOpen, HelpCircle, Search, SlidersHorizontal } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@houdoku/ui/components/Select';
import { Checkbox } from '@houdoku/ui/components/Checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@houdoku/ui/components/Tooltip';
import { Input } from '@houdoku/ui/components/Input';
import { Label } from '@houdoku/ui/components/Label';

interface Props {
  extensionList: ExtensionMetadata[];
  hasFilterOptions: boolean;
  loading: boolean;
  filterCount: number;
  handleSearch: (fresh?: boolean) => void;
  handleSearchFilesystem: (searchPaths: string[]) => void;
}

const SearchControlBar: React.FC<Props> = (props: Props) => {
  const [searchExtension, setSearchExtension] = useRecoilState(searchExtensionState);
  const [searchText, setSearchText] = useRecoilState(searchTextState);
  const [showingFilters, setShowingFilterDrawer] = useRecoilState(showingFilterDrawerState);
  const [multiSeriesEnabled, setMultiSeriesEnabled] = useState(false);

  const handleSelectDirectory = async () => {
    const fileList = await ipcRenderer.invoke(
      ipcChannels.APP.SHOW_OPEN_DIALOG,
      true,
      [],
      'Select Series Directory',
    );
    if (fileList.length <= 0) return;

    const selectedPath = fileList[0];

    const searchPaths = multiSeriesEnabled
      ? await ipcRenderer.invoke(ipcChannels.FILESYSTEM.LIST_DIRECTORY, selectedPath)
      : [selectedPath];

    props.handleSearchFilesystem(searchPaths);
  };

  const renderFilesystemControls = () => {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <Button disabled={props.loading} onClick={handleSelectDirectory}>
          <FolderOpen />
          Select directory
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex space-x-2 items-center">
                <Checkbox
                  id="checkboxMultiSeriesMode"
                  checked={multiSeriesEnabled}
                  onCheckedChange={() => setMultiSeriesEnabled(!multiSeriesEnabled)}
                />
                <Label
                  htmlFor="checkboxMultiSeriesMode"
                  className="flex text-sm font-medium items-center space-x-2"
                >
                  <span>Multi-series mode</span>
                  <HelpCircle className="w-4 h-4" />
                </Label>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>
                When multi-series mode is enabled, each item in the selected
                <br />
                directory is treated as a separate series.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  const renderStandardControls = () => {
    return (
      <>
        <form
          className="flex min-w-0 flex-1 gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            props.handleSearch(true);
          }}
        >
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 w-full"
              aria-label="Search for a series"
              value={searchText}
              placeholder="Search for a series..."
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={props.loading}>
            Search
          </Button>
        </form>
        {props.hasFilterOptions ? (
          <Button
            variant="outline"
            aria-expanded={showingFilters}
            onClick={() => setShowingFilterDrawer(!showingFilters)}
          >
            <SlidersHorizontal />
            Filters{props.filterCount > 0 && ` (${props.filterCount})`}
          </Button>
        ) : undefined}
      </>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={searchExtension}
        onValueChange={(value) => setSearchExtension(value || searchExtension)}
      >
        <SelectTrigger aria-label="Source" className="w-full sm:w-52 shrink-0">
          <SelectValue placeholder="Select source" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {props.extensionList
              .map((metadata: ExtensionMetadata) => ({
                value: metadata.id,
                label: metadata.name,
              }))
              .map((metadata) => (
                <SelectItem key={metadata.value} value={metadata.value}>
                  {metadata.label}
                </SelectItem>
              ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {searchExtension === FS_METADATA.id ? renderFilesystemControls() : renderStandardControls()}
    </div>
  );
};

export default SearchControlBar;
