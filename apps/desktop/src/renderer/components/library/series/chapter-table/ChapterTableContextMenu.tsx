import { ContextMenuContent, ContextMenuItem } from '@houdoku/ui/components/ContextMenu';
import { DropdownMenuContent, DropdownMenuItem } from '@houdoku/ui/components/DropdownMenu';
import { Download, Eye, EyeOff, Play, Pointer } from 'lucide-react';

type Props = {
  context?: boolean;
  read: boolean;
  canDownload: boolean;
  retry: boolean;
  onRead: () => void;
  onMark: () => void;
  onSelectPrevious: () => void;
  onDownload: () => void;
};
// Both entry points expose the same actions and use the same chapter IDs.
export function ChapterTableContextMenu({ context = true, ...props }: Props) {
  const Content = context ? ContextMenuContent : DropdownMenuContent;
  const Item = context ? ContextMenuItem : DropdownMenuItem;
  return (
    <Content className="w-48">
      <Item onSelect={props.onRead}>
        <Play className="h-4 w-4 mr-2" />
        Read chapter
      </Item>
      <Item onSelect={props.onMark}>
        {props.read ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
        {props.read ? 'Mark unread' : 'Mark read'}
      </Item>
      <Item onSelect={props.onSelectPrevious}>
        <Pointer className="h-4 w-4 mr-2" />
        Select previous
      </Item>
      <Item disabled={!props.canDownload} onSelect={props.onDownload}>
        <Download className="h-4 w-4 mr-2" />
        {props.retry ? 'Retry download' : 'Download'}
      </Item>
    </Content>
  );
}
