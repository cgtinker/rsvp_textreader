import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const target = process.argv[2]
if (!target || !['firefox', 'safari'].includes(target)) {
  console.error('Usage: node scripts/ext-postbuild.mjs <firefox|safari>')
  process.exit(1)
}

const src = join(root, 'src-ext', `manifest.${target}.json`)
const dest = join(root, 'build', 'manifest.json')

if (!existsSync(src)) {
  console.error(`Manifest not found: ${src}`)
  process.exit(1)
}

if (!existsSync(join(root, 'build'))) {
  console.error('build/ directory not found — run vite build first')
  process.exit(1)
}

copyFileSync(src, dest)
console.log(`✓ Copied manifest.${target}.json → build/manifest.json`)

// Patch index.html: extract inline script and fix absolute paths
const htmlPath = join(root, 'build', 'index.html')
let html = readFileSync(htmlPath, 'utf-8')

const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/)
if (scriptMatch) {
  // Rewrite path so SvelteKit router sees "/" instead of "/index.html"
  const pathFix = `if (location.pathname.endsWith('/index.html')) {
  history.replaceState(null, '', location.pathname.replace(/\\/index\\.html$/, '/'));
}\n`
  let scriptContent = pathFix + scriptMatch[1]
  scriptContent = scriptContent.replaceAll('/_app/', './_app/')
  writeFileSync(join(root, 'build', 'init.js'), scriptContent)
  html = html.replace(scriptMatch[0], '<script src="init.js"></script>')
  console.log('✓ Extracted inline script → build/init.js')
}

html = html.replaceAll('/_app/', './_app/')
writeFileSync(htmlPath, html)
console.log('✓ Patched index.html for extension compatibility')
