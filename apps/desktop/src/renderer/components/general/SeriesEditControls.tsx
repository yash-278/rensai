import React from 'react';
import { Language, Series, SeriesStatus, Languages, LanguageKey } from '@tiyo/common';
const { ipcRenderer } = require('electron');
import ipcChannels from '@/common/constants/ipcChannels.json';
import constants from '@/common/constants/constants.json';
import ExtensionImage from './ExtensionImage';
import { FS_METADATA } from '@/common/temp_fs_metadata';
import blankCover from '@/renderer/img/blank_cover.png';
import { Label } from '@houdoku/ui/components/Label';
import { Input } from '@houdoku/ui/components/Input';
import { InputTags } from '@houdoku/ui/components/InputTags';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@houdoku/ui/components/Select';
import { ImageIcon } from 'lucide-react';
import { Button } from '@houdoku/ui/components/Button';

type Props = {
  series: Series;
  setSeries: (series: Series) => void;
  editable: boolean;
};

export const SeriesEditControls: React.FC<Props> = (props: Props) => {
  const getCoverSrcUrl = () => {
    if (props.series.extensionId === FS_METADATA.id) {
      return props.series.remoteCoverUrl
        ? `atom://${encodeURIComponent(props.series.remoteCoverUrl)}`
        : blankCover;
    }
    return props.series.remoteCoverUrl;
  };

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
      <div className="w-40 shrink-0 md:w-44 lg:w-48 flex flex-col space-y-2">
        <ExtensionImage
          className="w-auto h-auto aspect-[70/100] object-cover rounded-sm"
          url={getCoverSrcUrl()}
          series={props.series}
          alt={props.series.title}
        />
        <div className="relative mt-1 mb-2">
          <ImageIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Button
            className="cursor-pointer pl-8 w-full truncate"
            variant="outline"
            title={props.series.remoteCoverUrl}
            disabled={!props.editable}
            onClick={() =>
              ipcRenderer
                .invoke(
                  ipcChannels.APP.SHOW_OPEN_DIALOG,
                  false,
                  [
                    {
                      name: 'Image',
                      extensions: constants.IMAGE_EXTENSIONS,
                    },
                  ],
                  'Select Series Cover',
                )
                .then((fileList: string) => {
                  if (fileList.length > 0) {
                    props.setSeries({
                      ...props.series,
                      remoteCoverUrl: fileList[0],
                    });
                  }
                })
            }
          >
            {props.series.remoteCoverUrl || 'Select cover'}
          </Button>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col space-y-3">
        <div className="flex space-x-2 items-center">
          <Label className="min-w-20 text-right">Title</Label>
          <Input
            className="min-w-0 w-full"
            title={props.series.title}
            value={props.series.title}
            placeholder={'Title'}
            onChange={(e) =>
              props.setSeries({
                ...props.series,
                title: e.target.value,
              })
            }
            disabled={!props.editable}
          />
        </div>
        <div className="flex space-x-2 items-start">
          <Label className="min-w-20 pt-2 text-right" htmlFor="series-description">
            Description
          </Label>
          <textarea
            id="series-description"
            className="min-w-0 w-full resize-none rounded-control border border-input bg-field px-control-padding py-2 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            rows={4}
            placeholder={'Description'}
            title={props.series.description}
            value={props.series.description}
            onChange={(e) =>
              props.setSeries({
                ...props.series,
                description: e.target.value,
              })
            }
            readOnly={!props.editable}
          />
        </div>
        <div className="flex space-x-2 items-center">
          <Label className="min-w-20 text-right">Author(s)</Label>
          <InputTags
            className="min-w-0 [&>div]:max-w-full [&>div]:[overflow-wrap:anywhere] [&>input]:min-w-0"
            placeholder="Authors"
            value={props.series.authors}
            onChange={(values) => props.setSeries({ ...props.series, authors: [...values] })}
            disabled={!props.editable}
          />
        </div>
        <div className="flex space-x-2 items-center">
          <Label className="min-w-20 text-right">Artist(s)</Label>
          <InputTags
            className="min-w-0 [&>div]:max-w-full [&>div]:[overflow-wrap:anywhere] [&>input]:min-w-0"
            placeholder="Artists"
            value={props.series.artists}
            onChange={(values) => props.setSeries({ ...props.series, artists: [...values] })}
            disabled={!props.editable}
          />
        </div>
        <div className="flex space-x-2 items-center">
          <Label className="min-w-20 text-right">Tags</Label>
          <InputTags
            className="min-w-0 [&>div]:max-w-full [&>div]:[overflow-wrap:anywhere] [&>input]:min-w-0"
            placeholder="Tags"
            value={props.series.tags}
            onChange={(values) => props.setSeries({ ...props.series, tags: [...values] })}
            disabled={!props.editable}
          />
        </div>
        <div className="flex space-x-2 items-center">
          <Label className="min-w-20 text-right">Language</Label>
          <Select
            value={props.series.originalLanguageKey}
            onValueChange={(value) =>
              props.setSeries({ ...props.series, originalLanguageKey: value as LanguageKey })
            }
            disabled={!props.editable}
          >
            <SelectTrigger className="min-w-0 w-full">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(Languages).map((language: Language) => (
                <SelectItem key={language.key} value={language.key}>
                  {language.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2 items-center">
          <Label className="min-w-20 text-right">Status</Label>
          <Select
            value={props.series.status}
            onValueChange={(value) =>
              props.setSeries({ ...props.series, status: value as SeriesStatus })
            }
            disabled={!props.editable}
          >
            <SelectTrigger className="min-w-0 w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(SeriesStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
