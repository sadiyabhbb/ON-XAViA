// Load environment variables
import 'dotenv/config';

import { spawn } from 'child_process';
import fs from 'fs';
import semver from 'semver';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './core/var/modules/logger.js';
import loadPlugins from './core/var/modules/installDep.js';

// Resolve path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BOT_ENTRY = path.join(__dirname, 'core', '_build.js');

// Check for update
async function checkUpdate() {
    logger.custom("Checking for updates...", "UPDATE");
    try {
        const res = await axios.get('https://raw.githubusercontent.com/XaviaTeam/XaviaBot/main/package.json');
        const latest = res.data.version;
        const current = JSON.parse(fs.readFileSync('./package.json')).version;

        if (semver.lt(current, latest)) {
            logger.warn(`New version available: ${latest}`);
            logger.warn(`Current version: ${current}`);
        } else {
            logger.custom("No updates available.", "UPDATE");
        }
    } catch (err) {
        logger.error("Failed to check for updates.");
    }
}

// Bot start handler
async function startBot() {
    await checkUpdate();
    await loadPlugins();

    const child = spawn('node', [BOT_ENTRY], {
        stdio: 'inherit',
        env: process.env
    });

    child.on('close', (code) => {
        if (code === 0) {
            logger.custom('Bot exited normally.', 'EXIT');
        } else {
            logger.error(`Bot crashed with code ${code}`);
            // Optional: Restart logic
            // logger.warn("Restarting in 3s...");
            // setTimeout(startBot, 3000);
        }
    });
}

// Node version check (no execSync!)
const nodeMajor = parseInt(process.version.slice(1).split('.')[0]);
if (nodeMajor < 16) {
    logger.error('Xavia requires Node.js v16 or higher. Please upgrade.');
    process.exit(1);
}

startBot();
