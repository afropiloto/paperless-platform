// CommonJS wrapper to execute TypeScript files with ts-node + path aliases
// Usage: node scripts/run-ts.js <path-to-ts-file>

const path = require('path');

require('dotenv').config();

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'CommonJS',
  },
});

require('tsconfig-paths').register();

const target = process.argv[2];
if (!target) {
  console.error('Usage: node scripts/run-ts.js <path-to-ts-file>');
  process.exit(1);
}

require(path.resolve(target));


