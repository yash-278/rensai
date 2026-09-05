import { useRecoilState, useRecoilValue } from 'recoil';
import { PageStyle, ReadingDirection, OffsetPages } from '@/common/models/types';
import * as states from '@/renderer/state/settingStates';
import {
  NumberPreference,
  TogglePreference,
  togglePreference,
  type Preference,
} from './SettingsFields';
function PageStylePreference() {
  const [value, setValue] = useRecoilState(states.pageStyleState);
  return (
    <div className="settings-page-styles" role="group" aria-labelledby="pageStyle-label">
      {[
        [PageStyle.Single, 'Single page'],
        [PageStyle.Double, 'Double page'],
        [PageStyle.LongStrip, 'Long strip'],
      ].map(([style, label]) => (
        <button
          type="button"
          key={style}
          aria-pressed={value === style}
          onClick={() => setValue(style as PageStyle)}
        >
          <span
            className={`settings-page-sketch ${style === PageStyle.LongStrip ? 'vertical' : ''}`}
            aria-hidden="true"
          >
            <i />
            {style !== PageStyle.Single && <i />}
          </span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
function PageGap() {
  const style = useRecoilValue(states.pageStyleState);
  return (
    <TogglePreference id="gap" state={states.pageGapState} disabled={style === PageStyle.Single} />
  );
}
function Stretch() {
  const width = useRecoilValue(states.fitContainToWidthState);
  const height = useRecoilValue(states.fitContainToHeightState);
  return (
    <TogglePreference id="stretch" state={states.fitStretchState} disabled={!width && !height} />
  );
}
function Offset() {
  const style = useRecoilValue(states.pageStyleState);
  const [value, setValue] = useRecoilState(states.offsetPagesState);
  return (
    <select
      id="offset"
      className="settings-select"
      aria-labelledby="offset-label"
      aria-describedby="offset-description"
      value={value}
      disabled={style !== PageStyle.Double}
      onChange={(e) => setValue(e.target.value as OffsetPages)}
    >
      <option value={OffsetPages.First}>First page</option>
      <option value={OffsetPages.All}>All pages</option>
      <option value={OffsetPages.None}>No offset</option>
    </select>
  );
}
function Direction() {
  const [value, setValue] = useRecoilState(states.readingDirectionState);
  return (
    <select
      id="direction"
      className="settings-select"
      aria-labelledby="direction-label"
      value={value}
      onChange={(e) => setValue(e.target.value as ReadingDirection)}
    >
      <option value={ReadingDirection.RightToLeft}>Right to left</option>
      <option value={ReadingDirection.LeftToRight}>Left to right</option>
    </select>
  );
}
function PageWidth() {
  const [value, setValue] = useRecoilState(states.maxPageWidthState);
  const [unit, setUnit] = useRecoilState(states.pageWidthMetricState);
  return (
    <div className="settings-inline-actions">
      <NumberPreference
        id="width"
        value={value}
        onChange={setValue}
        min={10}
        max={unit === '%' ? 100 : window.innerWidth}
      />
      <select
        id="unit"
        aria-label="Page width unit"
        className="settings-select"
        value={unit}
        onChange={(e) => {
          const next = e.target.value;
          setUnit(next);
          setValue(Math.max(10, Math.min(value, next === '%' ? 100 : window.innerWidth)));
        }}
      >
        <option value="%">%</option>
        <option value="px">px</option>
      </select>
    </div>
  );
}
export const readerPreferences: Preference[] = [
  {
    id: 'pageStyle',
    section: 'reader',
    group: 'Page layout',
    title: 'Page style',
    wide: true,
    control: <PageStylePreference />,
  },
  {
    id: 'gap',
    section: 'reader',
    group: 'Page layout',
    title: 'Spacing between pages',
    description: 'Leave a small gap between pages. Available with Double page or Long strip.',
    control: <PageGap />,
  },
  {
    id: 'offset',
    section: 'reader',
    group: 'Page layout',
    title: 'Double-page offset',
    description: 'Choose which pages start on their own. Available with Double page.',
    control: <Offset />,
  },
  {
    id: 'direction',
    section: 'reader',
    group: 'Page layout',
    title: 'Reading direction',
    control: <Direction />,
  },
  togglePreference(
    'fitWidth',
    'reader',
    'Image sizing',
    'Fit to width',
    'Keep pages within the available width.',
    states.fitContainToWidthState,
  ),
  togglePreference(
    'fitHeight',
    'reader',
    'Image sizing',
    'Fit to height',
    'Keep pages within the available height.',
    states.fitContainToHeightState,
  ),
  {
    id: 'stretch',
    section: 'reader',
    group: 'Image sizing',
    title: 'Stretch small pages',
    description: 'Enlarge small images. Requires Fit to width or Fit to height.',
    control: <Stretch />,
  },
  {
    id: 'width',
    section: 'reader',
    group: 'Image sizing',
    title: 'Maximum page width',
    description: 'Limit how wide a page can appear.',
    control: <PageWidth />,
  },
  togglePreference(
    'contrast',
    'reader',
    'Rendering',
    'Optimize image contrast',
    'Adjust contrast while displaying page images.',
    states.optimizeContrastState,
  ),
];
