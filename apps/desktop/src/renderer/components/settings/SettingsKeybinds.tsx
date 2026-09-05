import { useState } from 'react';
import { useRecoilState, type RecoilState } from 'recoil';
import { Button } from '@houdoku/ui/components/Button';
import { DefaultSettings, ReaderSetting } from '@/common/models/types';
import * as states from '@/renderer/state/settingStates';
import type { Preference } from './SettingsFields';
const bindings: [string, ReaderSetting, RecoilState<string>][] = [
  ['Turn page right', ReaderSetting.KeyPageRight, states.keyPageRightState],
  ['Turn page left', ReaderSetting.KeyPageLeft, states.keyPageLeftState],
  ['First page', ReaderSetting.KeyFirstPage, states.keyFirstPageState],
  ['Last page', ReaderSetting.KeyLastPage, states.keyLastPageState],
  ['Change chapter right', ReaderSetting.KeyChapterRight, states.keyChapterRightState],
  ['Change chapter left', ReaderSetting.KeyChapterLeft, states.keyChapterLeftState],
  ['Exit reader', ReaderSetting.KeyExit, states.keyExitState],
  ['Close', ReaderSetting.KeyCloseOrBack, states.keyCloseOrBackState],
  [
    'Toggle reading direction',
    ReaderSetting.KeyToggleReadingDirection,
    states.keyToggleReadingDirectionState,
  ],
  ['Toggle page style', ReaderSetting.KeyTogglePageStyle, states.keyTogglePageStyleState],
  [
    'Toggle double page offset',
    ReaderSetting.KeyToggleOffsetDoubleSpreads,
    states.keyToggleOffsetDoubleSpreadsState,
  ],
  ['Toggle fullscreen', ReaderSetting.KeyToggleFullscreen, states.keyToggleFullscreenState],
  [
    'Show settings menu',
    ReaderSetting.KeyToggleShowingSettingsModal,
    states.keyToggleShowingSettingsModalState,
  ],
  ['Toggle sidebar', ReaderSetting.KeyToggleShowingSidebar, states.keyToggleShowingSidebarState],
];
function Shortcut({
  name,
  setting,
  state,
}: { name: string; setting: ReaderSetting; state: RecoilState<string> }) {
  const [value, setValue] = useRecoilState(state);
  const [recording, setRecording] = useState(false);
  return (
    <div className="settings-inline-actions">
      <Button
        variant="outline"
        className="settings-shortcut"
        aria-label={`Change shortcut for ${name}`}
        data-recording={recording}
        onClick={() => setRecording(true)}
        onBlur={() => setRecording(false)}
        onKeyDown={(e) => {
          if (!recording) return;
          if (e.key === 'Tab') {
            setRecording(false);
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          if (e.key === 'Escape') {
            setRecording(false);
            return;
          }
          if (['Control', 'Shift', 'Meta', 'Command', 'Alt', 'Option'].includes(e.key)) return;
          const key = e.key
            .toLowerCase()
            .replace('arrow', '')
            .replace('insert', 'ins')
            .replace('delete', 'del')
            .replace(' ', 'space')
            .replace('+', 'plus');
          setValue(
            `${e.metaKey ? 'meta+' : ''}${e.ctrlKey ? 'ctrl+' : ''}${e.altKey ? 'alt+' : ''}${e.shiftKey ? 'shift+' : ''}${key}`,
          );
          setRecording(false);
        }}
      >
        {recording ? (
          'Press keys…'
        ) : (
          <kbd>
            {value
              .split('+')
              .map((key) => key.charAt(0).toUpperCase() + key.slice(1))
              .join(' + ')}
          </kbd>
        )}
      </Button>
      <Button
        variant="ghost"
        aria-label={`Reset shortcut for ${name}`}
        disabled={value === DefaultSettings[setting]}
        onClick={() => setValue(DefaultSettings[setting] as string)}
      >
        Reset
      </Button>
    </div>
  );
}
export const shortcutPreferences: Preference[] = bindings.map(([name, setting, state], index) => ({
  id: `shortcut-${index}`,
  section: 'shortcuts',
  group: index < 8 ? 'Navigation' : 'Reader controls',
  title: name,
  keywords: 'keyboard hotkey keybind',
  control: <Shortcut name={name} setting={setting} state={state} />,
}));
