#!/usr/bin/env bun

// Dynamic API Server Startup Script
// Supports different environments without code changes

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get environment from command line argument or default to development
const environment = process.argv[2] || 'development';

console.log(`🚀 Starting City Search API Server in ${environment} mode...\n`);

// Determine config file based on environment
const configFiles = {
  development: 'config.env',
  staging: 'config.staging.env',
  production: 'config.production.env'
};

const configFile = configFiles[environment] || configFiles.development;
const configPath = join(__dirname, configFile);

// Check if config file exists
if (!existsSync(configPath)) {
  console.error(`❌ Configuration file not found: ${configFile}`);
  console.log('Available environments:');
  Object.keys(configFiles).forEach(env => {
    console.log(`  - ${env}: ${configFiles[env]}`);
  });
  process.exit(1);
}

console.log(`📁 Using configuration: ${configFile}`);
console.log(`🔧 Config path: ${configPath}\n`);

// Set environment variables
process.env.NODE_ENV = environment;

// Start the API server
const apiProcess = spawn('bun', ['run', 'api/cities.js'], {
  stdio: 'inherit',
  cwd: join(__dirname, '..'),
  env: {
    ...process.env,
    CONFIG_FILE: configFile
  }
});

// Handle process events
apiProcess.on('error', (error) => {
  console.error('❌ Failed to start API server:', error);
  process.exit(1);
});

apiProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ API server exited with code ${code}`);
    process.exit(1);
  }
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down API server...');
  apiProcess.kill('SIGINT');
  process.exit(0);
});

console.log('⏳ Starting server...');
