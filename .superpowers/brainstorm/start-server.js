const path = require('path');
const serverPath = path.resolve('C:/Users/obai/.config/opencode/node_modules/superpowers/skills/brainstorming/scripts/server.cjs');
const baseDir = path.resolve(__dirname, 'session-' + Date.now());

process.env.BRAINSTORM_DIR = baseDir;
process.env.BRAINSTORM_HOST = '127.0.0.1';
process.env.BRAINSTORM_URL_HOST = 'localhost';

require(serverPath);
