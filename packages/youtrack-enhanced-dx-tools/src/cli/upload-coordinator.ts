#!/usr/bin/env node

import { UploadCoordinator } from '../upload-coordinator.js';

const args = process.argv.slice(2);

// Parse simple CLI args
let stateFile = '.build-state.json';
let debounceMs = 1000;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--watch' || arg === '-w') {
    const next = args[i + 1];
    if (next && !next.startsWith('-')) {
      stateFile = next;
      i++;
    }
  } else if (arg === '--debounce' || arg === '-d') {
    const next = args[i + 1];
    if (next && !next.startsWith('-')) {
      debounceMs = parseInt(next, 10) || debounceMs;
      i++;
    }
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
Usage: youtrack-upload-coordinator [options]

Options:
  --watch, -w <file>      Build state file to watch (default: .build-state.json)
  --debounce, -d <ms>     Debounce delay in milliseconds (default: 1000)
  --help, -h              Show this help message

Description:
  Watches the build state file and coordinates uploads when builds complete.
  Ensures only one upload happens even when multiple builds finish.
    `);
    process.exit(0);
  }
}

const coordinator = new UploadCoordinator({
  stateFile,
  debounceMs
});

coordinator.start();

console.log('[upload-coordinator] Started successfully');
console.log(`[upload-coordinator] State file: ${stateFile}`);
console.log(`[upload-coordinator] Debounce: ${debounceMs}ms`);
