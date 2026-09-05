import { Link } from 'react-router-dom';
import { Button } from '@houdoku/ui/components/Button';
import { DialogClose } from '@houdoku/ui/components/Dialog';
import routes from '@/common/constants/routes.json';
import { discordPresenceEnabledState } from '@/renderer/state/settingStates';
import { togglePreference, type Preference } from './SettingsFields';
export const integrationPreferences: Preference[] = [
  togglePreference(
    'discord',
    'integrations',
    'Discord',
    'Share reading activity',
    'Show what you are reading with Discord Rich Presence. Enable “Share your detected activities with others” in Discord too.',
    discordPresenceEnabledState,
  ),
  {
    id: 'sources',
    section: 'integrations',
    group: 'Sources',
    title: 'Source accounts and API keys',
    description: 'Manage credentials and source-specific preferences in Sources.',
    keywords: 'nhentai plugins password',
    control: (
      <DialogClose asChild>
        <Button variant="outline" asChild>
          <Link to={routes.PLUGINS}>Open Sources</Link>
        </Button>
      </DialogClose>
    ),
  },
];
