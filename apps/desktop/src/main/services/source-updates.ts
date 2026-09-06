import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import JSZip from 'jszip';

const RELEASE = 'https://github.com/yash-278/rensai-sources/releases/latest/download/';
const MAX_BUNDLE = 32 * 1024 * 1024;
const MAX_EXTRACTED = 160 * 1024 * 1024;
export const SOURCE_API_VERSION = 1;
export interface SourceRelease {
  version: string;
  apiVersion: number;
  sha256: string;
  size: number;
}

export function validateSourceRelease(value: SourceRelease): SourceRelease {
  if (
    !value ||
    !/^\d+\.\d+\.\d+$/.test(value.version) ||
    !/^[a-f0-9]{64}$/.test(value.sha256) ||
    !Number.isInteger(value.size) ||
    value.size <= 0 ||
    value.size > MAX_BUNDLE
  ) {
    throw Error('The source release manifest is invalid.');
  }
  if (value.apiVersion !== SOURCE_API_VERSION) {
    throw Error('This source release needs a newer desktop app.');
  }
  return value;
}

export function isNewerSourceVersion(candidate: string, installed: string): boolean {
  const left = candidate.split('.').map(Number);
  const right = installed.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return left[i] > right[i];
  }
  return false;
}

export function installedSourcePath(root: string): string | undefined {
  const pointer = join(root, 'current.json');
  if (!existsSync(pointer)) return undefined;
  const release = validateSourceRelease(JSON.parse(readFileSync(pointer, 'utf8')));
  return join(root, 'versions', `${release.version}-${release.sha256}`);
}

async function download(name: string, maxBytes: number, request: typeof fetch): Promise<Buffer> {
  const response = await request(RELEASE + name, { signal: AbortSignal.timeout(60000) });
  if (!response.ok || !response.body) {
    throw Error(
      response.status === 404
        ? 'No source release is available yet.'
        : 'Could not download the source release. Try again later.',
    );
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.length;
      if (size > maxBytes) throw Error('The source download exceeds the size limit.');
      chunks.push(chunk.value);
    }
  } finally {
    await reader.cancel();
  }
  return Buffer.concat(chunks);
}

export async function fetchSourceRelease(request: typeof fetch = fetch): Promise<SourceRelease> {
  return validateSourceRelease(
    JSON.parse((await download('manifest.json', 8192, request)).toString()),
  );
}

export async function fetchSourceBundle(release: SourceRelease, request: typeof fetch = fetch) {
  return download('rensai-sources.zip', validateSourceRelease(release).size, request);
}

// Install into a fresh directory, then switch one pointer. Existing clients keep their files
// until restart/reload, and a failed update never replaces the working provider.
export async function installSourceBundle(
  root: string,
  release: SourceRelease,
  buffer: Buffer,
  validate: (directory: string) => void,
): Promise<string> {
  validateSourceRelease(release);
  if (
    buffer.length !== release.size ||
    createHash('sha256').update(buffer).digest('hex') !== release.sha256
  ) {
    throw Error('The source bundle checksum does not match. Nothing was installed.');
  }
  const destination = join(root, 'versions', `${release.version}-${release.sha256}`);
  const staging = `${destination}.partial`;
  mkdirSync(join(root, 'versions'), { recursive: true });
  rmSync(staging, { recursive: true, force: true });
  try {
    const zip = await JSZip.loadAsync(buffer);
    let extracted = 0;
    for (const entry of Object.values(zip.files)) {
      const name =
        (entry as typeof entry & { unsafeOriginalName?: string }).unsafeOriginalName || entry.name;
      if (
        name.startsWith('/') ||
        name.includes('\\') ||
        name.includes(':') ||
        name.split('/').includes('..') ||
        (Number(entry.unixPermissions) & 0o170000) === 0o120000
      ) {
        throw Error('The source bundle contains an unsafe path.');
      }
      if (entry.dir) continue;
      const parts: Buffer[] = [];
      // Stream each entry so compressed data cannot allocate an unbounded buffer.
      for await (const part of new Readable().wrap(entry.nodeStream())) {
        extracted += part.length;
        if (extracted > MAX_EXTRACTED)
          throw Error('The source bundle exceeds the extracted size limit.');
        parts.push(part);
      }
      const filename = join(staging, name);
      mkdirSync(dirname(filename), { recursive: true });
      writeFileSync(filename, Buffer.concat(parts));
    }
    const manifest = JSON.parse(readFileSync(join(staging, 'package.json'), 'utf8'));
    if (
      manifest.name !== '@rensai/sources' ||
      manifest.version !== release.version ||
      manifest.rensaiApiVersion !== SOURCE_API_VERSION ||
      manifest.main !== './src/index.js'
    ) {
      throw Error('The source package does not match its release manifest.');
    }
    validate(staging);
    if (!existsSync(destination)) renameSync(staging, destination);
    writeFileSync(join(root, 'current.json.tmp'), JSON.stringify(release));
    renameSync(join(root, 'current.json.tmp'), join(root, 'current.json'));
    return destination;
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}
