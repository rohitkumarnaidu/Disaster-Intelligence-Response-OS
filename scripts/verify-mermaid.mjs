import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = walk('docs');
console.log('Auditing', files.length, 'documentation files...');

let mermaidCount = 0;
let syntaxWarnings = [];
let unwantedSymbols = [];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');

  // Check 1: Scan for unwanted / raw unescaped LaTeX symbols outside of code blocks
  const nonCode = content.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
  if (/\\text\{/.test(nonCode)) {
    unwantedSymbols.push({ file: f, issue: 'Unescaped LaTeX \\text{} found outside code blocks' });
  }
  if (/\\mathcal\{/.test(nonCode)) {
    unwantedSymbols.push({ file: f, issue: 'Unescaped LaTeX \\mathcal{} found outside code blocks' });
  }

  // Check 2: Scan Mermaid diagrams
  const mermaidMatches = [...content.matchAll(/```mermaid([\s\S]*?)```/g)];
  for (const m of mermaidMatches) {
    mermaidCount++;
    const diagram = m[1].trim();
    const dLines = diagram.split('\n');
    for (let l = 0; l < dLines.length; l++) {
      const rawLine = dLines[l].trim();
      if (diagram.startsWith('flowchart') || diagram.startsWith('graph')) {
        // Find node labels that contain '(' or ')' or '<br/>' without quotes
        if (rawLine.includes('[') && rawLine.includes(']')) {
          const inner = rawLine.substring(rawLine.indexOf('[') + 1, rawLine.lastIndexOf(']'));
          if (!inner.startsWith('"') && !inner.endsWith('"')) {
            if (inner.includes('(') || inner.includes(')') || inner.includes('<br') || inner.includes('/') || inner.includes('#')) {
              syntaxWarnings.push({ file: f, line: l + 1, content: rawLine, reason: 'Unquoted special chars in flowchart node' });
            }
          }
        }
      }
    }
  }
}

console.log('\n=== COMPLETE DOCUMENTATION AUDIT ===');
console.log('Total Markdown Files:', files.length);
console.log('Total Mermaid Diagrams:', mermaidCount);
console.log('Unwanted Symbols Found:', unwantedSymbols.length);
if (unwantedSymbols.length > 0) {
  console.log(JSON.stringify(unwantedSymbols, null, 2));
}
console.log('Mermaid Syntax Warnings:', syntaxWarnings.length);
if (syntaxWarnings.length > 0) {
  console.log(JSON.stringify(syntaxWarnings, null, 2));
}
console.log('====================================\n');