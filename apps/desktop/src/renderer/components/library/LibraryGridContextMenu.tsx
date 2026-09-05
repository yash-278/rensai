import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@houdoku/ui/components/DropdownMenu';
import React from 'react';
import { Series } from '@tiyo/common';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { useNavigate } from 'react-router-dom';
import {
  categoryListState,
  chapterListState,
  multiSelectEnabledState,
  multiSelectSeriesListState,
  seriesListState,
  seriesState,
} from '@/renderer/state/libraryStates';
import { goToSeries, markChapters, removeSeries } from '@/renderer/features/library/utils';
import { chapterLanguagesState, confirmRemoveSeriesState } from '@/renderer/state/settingStates';
import library from '@/renderer/services/library';
import {
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@houdoku/ui/components/ContextMenu';
import { CheckCheck, Play, Pointer, Tags, Trash2 } from 'lucide-react';

type Props = {
  dropdown?: boolean;
  series: Series | null;
  showRemoveModal: (series: Series) => void;
};

const LibraryGridContextMenu: React.FC<Props> = (props: Props) => {
  const navigate = useNavigate();
  const availableCategories = useRecoilValue(categoryListState);
  const confirmRemoveSeries = useRecoilValue(confirmRemoveSeriesState);
  const setSeriesList = useSetRecoilState(seriesListState);
  const setSeries = useSetRecoilState(seriesState);
  const setChapterList = useSetRecoilState(chapterListState);
  const setMultiSelectEnabled = useSetRecoilState(multiSelectEnabledState);
  const setMultiSelectSeriesList = useSetRecoilState(multiSelectSeriesListState);
  const chapterLanguages = useRecoilValue(chapterLanguagesState);

  const viewFunc = () => {
    if (props.series) {
      goToSeries(props.series, navigate);
    }
  };

  const markAllReadFunc = () => {
    if (props.series?.id) {
      const chapters = library.fetchChapters(props.series.id);
      markChapters(chapters, props.series, true, setChapterList, setSeries, chapterLanguages);
      setSeriesList(library.fetchSeriesList());
    }
  };

  const multiSelectFunc = () => {
    if (props.series) {
      setMultiSelectEnabled(true);
      setMultiSelectSeriesList([props.series]);
    }
  };

  const removeFunc = () => {
    if (props.series) {
      if (confirmRemoveSeries) {
        props.showRemoveModal(props.series);
      } else {
        removeSeries(props.series, setSeriesList);
      }
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (!props.series) return;

    const categories = props.series.categories || [];
    let newCategories: string[] = [...categories, categoryId];
    if (categories.includes(categoryId)) {
      newCategories = categories.filter((cat) => cat !== categoryId);
    }

    library.upsertSeries({
      ...props.series,
      categories: newCategories,
    });
    setSeriesList(library.fetchSeriesList());
  };

  const MenuCheckboxItem = props.dropdown ? DropdownMenuCheckboxItem : ContextMenuCheckboxItem;
  const MenuContent = props.dropdown ? DropdownMenuContent : ContextMenuContent;
  const MenuItem = props.dropdown ? DropdownMenuItem : ContextMenuItem;
  const MenuSub = props.dropdown ? DropdownMenuSub : ContextMenuSub;
  const MenuSubContent = props.dropdown ? DropdownMenuSubContent : ContextMenuSubContent;
  const MenuSubTrigger = props.dropdown ? DropdownMenuSubTrigger : ContextMenuSubTrigger;
  return (
    <MenuContent className="w-48">
      <MenuItem onClick={viewFunc}>
        <Play className="h-4 w-4 mr-2" />
        View series
      </MenuItem>
      <MenuItem onClick={markAllReadFunc}>
        <CheckCheck className="h-4 w-4 mr-2" />
        Mark all read
      </MenuItem>
      <MenuItem onClick={multiSelectFunc}>
        <Pointer className="h-4 w-4 mr-2" />
        Select series
      </MenuItem>
      {availableCategories.length > 0 && (
        <MenuSub>
          <MenuSubTrigger>
            <Tags className="h-4 w-4 mr-2" />
            Categories
          </MenuSubTrigger>
          <MenuSubContent className="w-48 max-h-64">
            {availableCategories.map((category) => (
              <MenuCheckboxItem
                key={category.id}
                checked={props.series?.categories?.includes(category.id)}
                onClick={() => toggleCategory(category.id)}
              >
                {category.label}
              </MenuCheckboxItem>
            ))}
          </MenuSubContent>
        </MenuSub>
      )}
      <MenuItem onClick={removeFunc}>
        <Trash2 className="h-4 w-4 mr-2" />
        Remove series
      </MenuItem>
    </MenuContent>
  );
};

export default LibraryGridContextMenu;
