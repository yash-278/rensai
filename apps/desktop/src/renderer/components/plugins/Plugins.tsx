import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
const { ipcRenderer } = require('electron');
import ipcChannels from '@/common/constants/ipcChannels.json';
import PluginSettingsModal from './PluginSettingsModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@houdoku/ui/components/Table';
import { Button } from '@houdoku/ui/components/Button';
import { Loader2 } from 'lucide-react';
import type { LocalSourceProviderStatus } from '@/common/models/LocalSourceProviderStatus';

const Plugins: React.FC = () => {
  const [provider, setProvider] = useState<LocalSourceProviderStatus | undefined>();
  const [showingSettingsModal, setShowingSettingsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const refreshProvider = async () => {
    setLoading(true);
    try {
      setProvider(
        await ipcRenderer.invoke(ipcChannels.EXTENSION_MANAGER.GET_LOCAL_PROVIDER_STATUS),
      );
    } finally {
      setLoading(false);
    }
  };

  const reloadProvider = async () => {
    setLoading(true);
    try {
      await ipcRenderer.invoke(ipcChannels.EXTENSION_MANAGER.RELOAD);
      await refreshProvider();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProvider();
  }, [location]);

  return (
    <>
      <PluginSettingsModal showing={showingSettingsModal} setShowing={setShowingSettingsModal} />

      <div className="flex justify-start py-2 space-x-2">
        <Button disabled={loading} onClick={() => refreshProvider()}>
          {loading && <Loader2 className="animate-spin" />}
          Refresh Status
        </Button>
        <Button variant="outline" disabled={loading} onClick={() => reloadProvider()}>
          {loading && <Loader2 className="animate-spin" />}
          Reload Sources
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Version</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Rensai Sources</TableCell>
            <TableCell>
              {provider?.error ? (
                <span role="alert">Could not load sources: {provider.error}</span>
              ) : (
                <>
                  {provider?.sourceCount ?? 0} source implementations. Live website compatibility is
                  checked separately.
                </>
              )}
            </TableCell>
            <TableCell className="text-center">{provider?.version ?? 'Not loaded'}</TableCell>
            <TableCell>
              {!provider?.error && provider?.version && (
                <Button variant="outline" onClick={() => setShowingSettingsModal(true)}>
                  Settings
                </Button>
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>
  );
};

export default Plugins;
