/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const [mode, ...files] = process.argv.slice(2);

const modes = {
  typedef: [[/..\/@otplib\//g, '../'], [/@otplib\//g, '../']]
};

const patterns = modes[mode];

if (!patterns) {
  throw new Error('No replacement mode found.');
}

const stats = {
  processed: files.length,
  modified: 0,
  unmodified: 0
};

files.forEach(file => {
  const fpath = path.join(cwd, file);
  const currentContent = fs.readFileSync(fpath, 'utf8');

  const updatedContent = patterns.reduce((txt, pattern) => {
    return txt.replace(...pattern);
  }, currentContent);

  fs.writeFileSync(fpath, updatedContent, 'utf8');

  if (currentContent === updatedContent) {
    stats.modified = stats.modified + 1;
  } else {
    stats.unmodified = stats.unmodified + 1;
  }
});

console.log('[updateContent]', stats);
