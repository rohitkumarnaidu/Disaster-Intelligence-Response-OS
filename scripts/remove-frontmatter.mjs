import fs from 'fs';
import path from 'path';

const DOCS_DIR = path.resolve(process.cwd(), 'docs');

function cleanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      cleanDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.startsWith('---')) {
        content = content.replace(/^---[\r\n]+[\s\S]*?[\r\n]+---[\r\n]+/, '');
        fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
        console.log(`Cleaned frontmatter from: ${path.relative(DOCS_DIR, fullPath)}`);
      }
    }
  }
}

cleanDirectory(DOCS_DIR);
console.log('Finished cleaning frontmatter from all markdown docs!');
