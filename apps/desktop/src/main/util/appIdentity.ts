import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import packageJson from '../../../package.json';

// Keep the existing profile when changing the display name. Electron otherwise
// derives a new userData/sessionData directory from productName and hides saved data.
const profilePath = path.join(app.getPath('appData'), 'Houdoku');
fs.mkdirSync(profilePath, { recursive: true });
app.setPath('userData', profilePath);
app.setPath('sessionData', profilePath);
app.setName(packageJson.productName);
