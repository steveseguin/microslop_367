import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const suiteDirectory = path.resolve(currentDirectory, '..');
const distDirectory = path.join(suiteDirectory, 'dist');
const docsDirectory = path.resolve(suiteDirectory, '..', 'docs');
const preservedFiles = new Map();

async function capturePreservedFiles() {
  for (const fileName of ['CNAME']) {
    const filePath = path.join(docsDirectory, fileName);

    try {
      preservedFiles.set(fileName, await readFile(filePath));
    } catch {
      // Ignore missing optional files.
    }
  }
}

async function clearDocsDirectory() {
  try {
    const entries = await readdir(docsDirectory, { withFileTypes: true });

    await Promise.all(
      entries.map((entry) =>
        rm(path.join(docsDirectory, entry.name), {
          recursive: true,
          force: true,
        }),
      ),
    );
  } catch {
    await mkdir(docsDirectory, { recursive: true });
  }
}

async function restorePreservedFiles() {
  await Promise.all(
    [...preservedFiles.entries()].map(([fileName, contents]) => writeFile(path.join(docsDirectory, fileName), contents)),
  );
}

await capturePreservedFiles();
await clearDocsDirectory();
await cp(distDirectory, docsDirectory, { recursive: true });
await restorePreservedFiles();

console.log(`Published ${distDirectory} to ${docsDirectory}`);
