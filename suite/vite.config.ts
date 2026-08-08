import { createHash } from 'node:crypto'
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Files that must NOT be precached on install.
 *
 * These are the editor engines. `excel-workbook` alone is 2.76 MB (597 kB gzip); the full
 * set is ~5.3 MB. Precaching all of it would charge every visitor a multi-megabyte install
 * so that someone who only ever writes documents can open a spreadsheet offline. They go
 * into the runtime cache instead: pulled in on first use, and pulled in ahead of time by an
 * idle warm pass that the page triggers AFTER it is interactive (see registerServiceWorker).
 *
 * Non-latin Inter subsets are here for the same reason. They are ~180 kB that a browser only
 * requests when the document actually contains Greek/Cyrillic/Vietnamese glyphs.
 */
const RUNTIME_ONLY_PATTERNS = [
  /^assets\/(Word|Excel|PowerPoint|ExcelWorkbook|SelectionChart)-/,
  /^assets\/(word-editor|word-io|excel-workbook|excel-io|excel-chart|slides-canvas|slides-io|zip-runtime)[-.]/,
  /^assets\/__vite-browser-external-/,
  /^assets\/inter-(?!latin-wght-)/,
]

/**
 * Hard ceiling on the install-time download, in bytes (uncompressed).
 *
 * This is a tripwire, not a preference. Everything not matched by RUNTIME_ONLY_PATTERNS is
 * precached, so a new heavy dependency landing in a chunk nobody remembered to classify
 * would silently turn a ~440 kB install into a multi-megabyte one. Failing the build is the
 * only way that gets noticed.
 */
const SHELL_BUDGET_BYTES = 700 * 1024

async function listFiles(directory: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      files.push(...(await listFiles(path.join(directory, entry.name), relative)))
    } else {
      files.push(relative)
    }
  }

  return files.sort()
}

/**
 * Generates `dist/sw.js` from `service-worker.js` after the build has been written.
 *
 * It runs in `closeBundle` and reads the real output directory rather than inspecting the
 * rollup bundle, because the precache list has to include things rollup never sees:
 * index.html, and everything copied out of public/ (favicon.svg, manifest.webmanifest).
 */
function serviceWorkerPlugin(): Plugin {
  let outDir = 'dist'
  let root = process.cwd()

  return {
    name: 'officeninja:service-worker',
    apply: 'build',
    configResolved(config) {
      root = config.root
      outDir = path.resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      const template = await readFile(path.resolve(root, 'service-worker.js'), 'utf8')
      const files = (await listFiles(outDir)).filter((file) => file !== 'sw.js' && !file.endsWith('.map'))

      const shell: string[] = []
      const warm: string[] = []

      for (const file of files) {
        if (RUNTIME_ONLY_PATTERNS.some((pattern) => pattern.test(file))) {
          warm.push(file)
        } else {
          shell.push(file)
        }
      }

      const sizes = await Promise.all(files.map(async (file) => [file, (await stat(path.join(outDir, file))).size] as const))
      const sizeOf = new Map(sizes)
      const sum = (list: string[]) => list.reduce((total, file) => total + (sizeOf.get(file) ?? 0), 0)
      const shellBytes = sum(shell)
      const warmBytes = sum(warm)

      if (shellBytes > SHELL_BUDGET_BYTES) {
        this.error(
          `Service worker shell precache is ${(shellBytes / 1024).toFixed(0)} kB, over the ` +
            `${(SHELL_BUDGET_BYTES / 1024).toFixed(0)} kB budget.\n` +
            `Largest shell entries:\n` +
            shell
              .slice()
              .sort((a, b) => (sizeOf.get(b) ?? 0) - (sizeOf.get(a) ?? 0))
              .slice(0, 5)
              .map((file) => `  ${file}  ${((sizeOf.get(file) ?? 0) / 1024).toFixed(0)} kB`)
              .join('\n') +
            `\nEither shrink the shell or add the new chunk to RUNTIME_ONLY_PATTERNS in vite.config.ts.`,
        )
      }

      /**
       * The version is a hash of every output filename and its size. Asset filenames already
       * carry content hashes, so this changes whenever any asset changes — which is what
       * makes the sw.js bytes change, which is the only thing that makes a browser adopt a
       * new worker. index.html is unhashed, so its size is folded in too.
       */
      const version = createHash('sha256')
        .update(sizes.map(([file, size]) => `${file}:${size}`).join('\n'))
        .digest('hex')
        .slice(0, 12)

      const source = template
        .replace("'__SW_VERSION__'", JSON.stringify(version))
        .replace('__SW_SHELL__', JSON.stringify(shell.map((file) => `./${file}`), null, 2))
        .replace('__SW_WARM__', JSON.stringify(warm.map((file) => `./${file}`), null, 2))

      await writeFile(path.join(outDir, 'sw.js'), source, 'utf8')

      const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} kB`
      console.log(
        `\nsw.js  version ${version}\n` +
          `  precached (install):   ${String(shell.length).padStart(3)} files  ${kb(shellBytes)}\n` +
          `  runtime (idle warm):   ${String(warm.length).padStart(3)} files  ${kb(warmBytes)}\n`,
      )
    },
  }
}

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            if (id.includes('vite/preload-helper')) {
              return 'route-loader'
            }

            return
          }

          if (id.includes('@fortune-sheet')) {
            return 'excel-workbook'
          }

          if (id.includes('@tiptap') || id.includes('prosemirror')) {
            return 'word-editor'
          }

          if (
            id.includes('/react/') ||
            id.includes('\\react\\') ||
            id.includes('react-dom') ||
            id.includes('scheduler')
          ) {
            return 'framework'
          }

          if (id.includes('react-router') || id.includes('@remix-run/router')) {
            return 'router'
          }

          if (id.includes('lucide-react')) {
            return 'ui-icons'
          }

          if (id.includes('idb')) {
            return 'storage'
          }

          if (id.includes('xlsx')) {
            return 'excel-io'
          }

          if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
            return 'excel-chart'
          }

          if (id.includes('fabric')) {
            return 'slides-canvas'
          }

          if (id.includes('jszip')) {
            return 'zip-runtime'
          }

          if (id.includes('pptxgenjs')) {
            return 'slides-io'
          }

          if (id.includes('docx') || id.includes('mammoth')) {
            return 'word-io'
          }
        }
      }
    }
  },
  plugins: [react(), serviceWorkerPlugin()]
})
