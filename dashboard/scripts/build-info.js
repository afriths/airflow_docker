#!/usr/bin/env node

// Build information generator for production builds
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getBuildInfo() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  
  let gitCommit = 'unknown';
  let gitBranch = 'unknown';
  let gitTag = 'unknown';
  
  try {
    gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    try {
      gitTag = execSync('git describe --tags --exact-match', { encoding: 'utf8' }).trim();
    } catch {
      // No exact tag match, use latest tag with commit info
      try {
        gitTag = execSync('git describe --tags --always', { encoding: 'utf8' }).trim();
      } catch {
        gitTag = 'no-tags';
      }
    }
  } catch (error) {
    console.warn('Warning: Could not retrieve git information:', error.message);
  }
  
  const buildInfo = {
    name: packageJson.name,
    version: packageJson.version,
    buildTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    git: {
      commit: gitCommit,
      branch: gitBranch,
      tag: gitTag
    },
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };
  
  return buildInfo;
}

function generateBuildInfo() {
  console.log('📦 Generating build information...');
  
  const buildInfo = getBuildInfo();
  const buildInfoPath = path.join(__dirname, '..', 'public', 'build-info.json');
  
  // Ensure public directory exists
  const publicDir = path.dirname(buildInfoPath);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
  
  console.log('✅ Build information generated:');
  console.log(`   Version: ${buildInfo.version}`);
  console.log(`   Environment: ${buildInfo.environment}`);
  console.log(`   Git Commit: ${buildInfo.git.commit.substring(0, 8)}`);
  console.log(`   Git Branch: ${buildInfo.git.branch}`);
  console.log(`   Git Tag: ${buildInfo.git.tag}`);
  console.log(`   Build Time: ${buildInfo.buildTime}`);
  console.log(`   File: ${buildInfoPath}`);
  
  return buildInfo;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateBuildInfo();
}

export { getBuildInfo, generateBuildInfo };