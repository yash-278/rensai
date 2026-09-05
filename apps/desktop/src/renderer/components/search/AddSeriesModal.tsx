import React, { useEffect, useState } from 'react';
const { ipcRenderer } = require('electron');
import { Series } from '@tiyo/common';
import { useRecoilState, useRecoilValue } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import ipcChannels from '@/common/constants/ipcChannels.json';
import { SeriesEditControls } from '../general/SeriesEditControls';
import { importingState, importQueueState } from '@/renderer/state/libraryStates';
import { goToSeries } from '@/renderer/features/library/utils';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@houdoku/ui/components/Dialog';
import { Button } from '@houdoku/ui/components/Button';
import { Skeleton } from '@houdoku/ui/components/Skeleton';

type Props = {
  series: Series | undefined;
  editable: boolean | undefined;
  showing: boolean;
  setShowing: (showing: boolean) => void;
};

const AddSeriesModal: React.FC<Props> = (props: Props) => {
  const navigate = useNavigate();
  const [customSeries, setCustomSeries] = useState<Series>();
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [detailsError, setDetailsError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [previewSeries, setPreviewSeries] = useState<Series>();
  const [importQueue, setImportQueue] = useRecoilState(importQueueState);
  const importing = useRecoilValue(importingState);

  useEffect(() => {
    let current = true;
    setLoadingDetails(true);
    setCustomSeries(undefined);
    setDetailsError(false);
    setPreviewSeries(undefined);

    if (props.series !== undefined) {
      // we can't guarantee the provided series has all of the available fields (since
      // they are not usually included in the search results) so we explicitly retrieve
      // all of the series data here

      console.debug(
        `AddSeriesModal is retrieving details for series ${props.series.sourceId} from extension ${props.series.extensionId}`,
      );
      ipcRenderer
        .invoke(ipcChannels.EXTENSION.GET_SERIES, props.series.extensionId, props.series.sourceId)
        .then((series?: Series) => {
          if (!current) return;
          if (series !== undefined) {
            console.debug(`AddSeriesModal found matching series ${series?.sourceId}`);
            setCustomSeries(series);
          } else {
            setDetailsError(true);
          }
          return series;
        })
        .catch(() => {
          if (current) setDetailsError(true);
        })
        .finally(() => {
          if (current) setLoadingDetails(false);
        });
    }
    return () => {
      current = false;
    };
  }, [props.series, retry]);

  useEffect(() => {
    if (
      previewSeries &&
      !importing &&
      !importQueue.some((task) => task.series.id === previewSeries.id)
    ) {
      goToSeries(previewSeries, navigate);
      props.setShowing(false);
    }
  }, [importQueue, importing, previewSeries]);

  const handleAdd = async () => {
    if (customSeries !== undefined) {
      setImportQueue((queue) => [...queue, { series: customSeries, getFirst: false }]);
      props.setShowing(false);
    }
  };

  const handlePreview = async () => {
    if (customSeries !== undefined) {
      const tempPreviewSeries = { ...customSeries, id: uuidv4(), preview: true };
      setPreviewSeries(tempPreviewSeries);
      setImportQueue((queue) => [...queue, { series: tempPreviewSeries, getFirst: false }]);
    }
  };

  return (
    <Dialog open={props.showing} onOpenChange={props.setShowing}>
      <DialogContent className="flex max-h-[min(640px,calc(100dvh-2rem))] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 md:max-w-[700px] lg:max-w-[800px]">
        <DialogHeader className="shrink-0 px-6 pb-4 pt-6 pr-12">
          <DialogTitle>Add series</DialogTitle>
        </DialogHeader>
        <div
          role="region"
          aria-label="Series details"
          tabIndex={0}
          className="min-h-0 overflow-y-auto overscroll-contain px-6 pb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          {detailsError ? (
            <div role="alert" className="py-6">
              <p className="text-danger">Could not load series details.</p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => setRetry((value) => value + 1)}
              >
                Try again
              </Button>
            </div>
          ) : loadingDetails || customSeries === undefined ? (
            <div className="flex space-x-4">
              <Skeleton className="w-40 md:w-44 lg:w-48 h-40" />
              <Skeleton className="w-full h-40" />
            </div>
          ) : (
            <SeriesEditControls
              series={customSeries}
              setSeries={(series: Series) => setCustomSeries(series)}
              editable={props.editable === true}
            />
          )}
        </div>
        <DialogFooter
          role="group"
          aria-label="Series actions"
          className="shrink-0 flex-row flex-wrap justify-end gap-2 border-t bg-background p-4 sm:space-x-0"
        >
          <Button variant={'secondary'} onClick={() => props.setShowing(false)}>
            Cancel
          </Button>
          <Button
            variant={'secondary'}
            onClick={handlePreview}
            disabled={loadingDetails || !customSeries || !!previewSeries}
          >
            Preview
          </Button>
          <Button
            type="submit"
            onClick={handleAdd}
            disabled={loadingDetails || !customSeries || !!previewSeries}
          >
            Add series
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddSeriesModal;
