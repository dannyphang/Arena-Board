import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const msgFilePath = process.argv[2];
if (!msgFilePath) {
  console.error('No message file path provided.');
  process.exit(1);
}

const commitMsg = fs.readFileSync(msgFilePath, 'utf8').trim();

// 1. Bump version in package.json
const rootPackageJsonPath = path.resolve(import.meta.dirname, '../package.json');
const rootPackage = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));
const versionParts = rootPackage.version.split('.').map(Number);
versionParts[2] += 1; // bump patch version
const newVersion = versionParts.join('.');
rootPackage.version = newVersion;
fs.writeFileSync(rootPackageJsonPath, JSON.stringify(rootPackage, null, 2) + '\n');

// 2. Bump version in server/package.json if exists
const serverPackageJsonPath = path.resolve(import.meta.dirname, '../server/package.json');
if (fs.existsSync(serverPackageJsonPath)) {
  const serverPackage = JSON.parse(fs.readFileSync(serverPackageJsonPath, 'utf8'));
  serverPackage.version = newVersion;
  fs.writeFileSync(serverPackageJsonPath, JSON.stringify(serverPackage, null, 2) + '\n');
}

// 3. Update server/src/index.ts version endpoint if needed
const serverIndexPath = path.resolve(import.meta.dirname, '../server/src/index.ts');
if (fs.existsSync(serverIndexPath)) {
  let serverIndex = fs.readFileSync(serverIndexPath, 'utf8');
  serverIndex = serverIndex.replace(/version: 'v[0-9\.]+'/g, `version: 'v${newVersion}'`);
  fs.writeFileSync(serverIndexPath, serverIndex);
}

// 4. Update src/config/version.ts
const versionTsPath = path.resolve(import.meta.dirname, '../src/config/version.ts');
let versionTs = fs.readFileSync(versionTsPath, 'utf8');

const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
const shortDateStr = new Date().toISOString().substring(0, 10);
const buildId = `bld-${new Date().toISOString().replace(/[-T:\.Z]/g, '').substring(0, 14)}-v${newVersion.replace(/\./g, '')}`;

// Extract current changeLog array string
const changeLogMatch = versionTs.match(/changeLog: \[([\s\S]*?)\]/);
let changeLogStr = '';
if (changeLogMatch) {
  changeLogStr = changeLogMatch[1];
}

const newLogEntry = `
    {
      version: 'v${newVersion}',
      date: '${shortDateStr}',
      prompt: ${JSON.stringify(commitMsg.split('\n')[0])},
      highlights: [
        ${JSON.stringify(commitMsg)}
      ],
    },`;

// Replace values in version.ts
versionTs = versionTs.replace(/version: 'v[0-9\.]+',/, `version: 'v${newVersion}',`);
versionTs = versionTs.replace(/releaseDate: '.*?',/, `releaseDate: '${dateStr}',`);
versionTs = versionTs.replace(/buildId: '.*?',/, `buildId: '${buildId}',`);
versionTs = versionTs.replace(/latestPrompt: '.*?',/, `latestPrompt: ${JSON.stringify(commitMsg.split('\n')[0])},`);
versionTs = versionTs.replace(/promptDescription:\s*'.*?',/s, `promptDescription:\n    ${JSON.stringify(commitMsg)},`);

// Inject new log entry
versionTs = versionTs.replace(/changeLog: \[/, `changeLog: [${newLogEntry}`);

fs.writeFileSync(versionTsPath, versionTs);

// 5. Add all these to git index
try {
  execSync('git add package.json server/package.json server/src/index.ts src/config/version.ts');
} catch (e) {
  console.error('Failed to git add', e);
}
