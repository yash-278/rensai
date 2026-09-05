const fs = require('fs');
const { ipcRenderer } = require('electron');
import { Series } from '@tiyo/common';
import constants from '@/common/constants/constants.json';
import ipcChannels from '@/common/constants/ipcChannels.json';
import { FS_METADATA } from '@/common/temp_fs_metadata';
import blankCover from '@/renderer/img/blank_cover.png';
import ExtensionImage from '../general/ExtensionImage';
const thumbnailsDir = await ipcRenderer.invoke(ipcChannels.GET_PATH.THUMBNAILS_DIR);
if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir);
}

const getImageSource = (series: Series) => {
  const fileExtensions = constants.IMAGE_EXTENSIONS;
  for (let i = 0; i < fileExtensions.length; i += 1) {
    const thumbnailPath = `${thumbnailsDir}/${series.id}.${fileExtensions[i]}`;
    if (fs.existsSync(thumbnailPath)) return `atom://${encodeURIComponent(thumbnailPath)}`;
  }

  if (series.extensionId === FS_METADATA.id) {
    return series.remoteCoverUrl
      ? `atom://${encodeURIComponent(series.remoteCoverUrl)}`
      : blankCover;
  }
  return series.remoteCoverUrl || blankCover;
};

export default function LibraryCover({ series, crop = true }: { series: Series; crop?: boolean }) {
  return (
    <ExtensionImage
      series={series}
      url={getImageSource(series).replaceAll('\\', '/')}
      alt=""
      className={`w-full rounded-control ${crop ? 'aspect-[7/10] object-cover' : 'h-auto'}`}
    />
  );
}
