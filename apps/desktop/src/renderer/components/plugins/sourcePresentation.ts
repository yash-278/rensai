import { ExtensionMetadata, LanguageKey, Languages, SettingType } from '@tiyo/common';
import type { SourceValues } from '@/renderer/services/sourceSettings';
export const NHENTAI_ID = '4e4f267e-e787-43e3-9697-6ef7adc8f4ee';
export const KOMGA_ID = 'b21fcfa9-8b46-439f-b060-31832aaf1931';
export const MANGADEX_ID = '6b4e9df1-b369-4adc-8d36-fe954dd793e3';
export type Field = {
  key: string;
  inputId: string;
  label: string;
  kind: 'text' | 'secret' | 'boolean' | 'unsupported';
  help?: string;
  example?: string;
};
export type Source = {
  id: string;
  name: string;
  domain: string;
  language: string;
  fields: Field[];
  values: SourceValues;
  settingsError?: boolean;
};
const presentation: Record<string, Record<string, Partial<Field>>> = {
  [NHENTAI_ID]: {
    'API Key': {
      label: 'API key',
      kind: 'secret',
      example: 'API key',
      help: 'Use a key issued by nhentai when the source requests authenticated access.',
    },
  },
  [MANGADEX_ID]: {
    'Use data saver': {
      label: 'Data saver',
      help: 'Request smaller page images to reduce data use.',
    },
  },
  [KOMGA_ID]: {
    'Address (with port)': {
      label: 'Server address',
      example: 'https://komga.example:25600',
      help: 'Enter your server address, including its port when needed.',
    },
    Username: { help: 'The username for your Komga account.' },
    Password: { kind: 'secret', help: 'The password for your Komga account.' },
  },
};
export function presentSource(
  metadata: ExtensionMetadata,
  types: Record<string, SettingType>,
  values: SourceValues,
): Source {
  let domain = metadata.url;
  try {
    domain = new URL(metadata.url).host;
  } catch {
    /* Metadata may have no website. */
  }
  return {
    id: metadata.id,
    name: metadata.name,
    domain,
    language:
      metadata.translatedLanguage === LanguageKey.MULTI
        ? 'Multiple languages'
        : metadata.translatedLanguage
          ? Languages[metadata.translatedLanguage]?.name || 'Multiple languages'
          : 'Not specified',
    values,
    fields: Object.entries(types).map(([key, type], index) => ({
      key,
      inputId: `source-field-${index}`,
      label: key,
      kind:
        type === SettingType.STRING
          ? 'text'
          : type === SettingType.BOOLEAN
            ? 'boolean'
            : 'unsupported',
      ...presentation[metadata.id]?.[key],
    })),
  };
}
export const setupNeeded = (source: Source) =>
  !source.settingsError &&
  source.id === KOMGA_ID &&
  !String(source.values['Address (with port)'] || '').trim();
