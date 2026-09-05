import {
  AniListTrackerMetadata,
  MALTrackerMetadata,
  MUTrackerMetadata,
} from '@/common/temp_tracker_metadata';
import { trackerAutoUpdateState } from '@/renderer/state/settingStates';
import { togglePreference, type Preference } from './SettingsFields';
import { TrackerAccount } from './TrackerAccount';
export const trackerPreferences: Preference[] = [
  togglePreference(
    'autoProgress',
    'trackers',
    'Progress',
    'Update chapter progress automatically',
    'Send reading progress for series linked to a tracker.',
    trackerAutoUpdateState,
  ),
  ...[AniListTrackerMetadata, MALTrackerMetadata, MUTrackerMetadata].map((metadata) => ({
    id: metadata.id,
    section: 'trackers',
    group: 'Accounts',
    title: metadata.name,
    description:
      metadata.id === MUTrackerMetadata.id
        ? 'Sign in with your MangaUpdates account.'
        : 'Authorize access through your browser.',
    control: (
      <TrackerAccount metadata={metadata} passwordAuth={metadata.id === MUTrackerMetadata.id} />
    ),
  })),
];
