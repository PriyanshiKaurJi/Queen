const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const NODE_VERSIONS_DIR = path.resolve('node_versions');
const CURRENT_VERSION_FILE = path.resolve(NODE_VERSIONS_DIR, 'current_version');

if (!fs.existsSync(NODE_VERSIONS_DIR)) fs.mkdirSync(NODE_VERSIONS_DIR);

const downloadNode = async (version, message) => {
    const url = `https://nodejs.org/dist/v${version}/node-v${version}-linux-x64.tar.gz`;
    const tarFile = path.resolve(NODE_VERSIONS_DIR, `node-v${version}.tar.gz`);
    const extractDir = path.resolve(NODE_VERSIONS_DIR, `node-v${version}`);
    try {
        execSync(`curl -o ${tarFile} ${url}`);
        execSync(`mkdir -p ${extractDir} && tar -xzf ${tarFile} -C ${extractDir} --strip-components=1`);
        fs.unlinkSync(tarFile);
        message.reply(`Node.js v${version} installed successfully.`);
    } catch (error) {
        message.reply(`Error installing Node.js v${version}: ${error.message}`);
    }
};

const setVersion = (version, message) => {
    const versionDir = path.resolve(NODE_VERSIONS_DIR, `node-v${version}`);
    if (!fs.existsSync(versionDir)) {
        message.reply(`Node.js v${version} is not installed. Use "install" to download it first.`);
        return;
    }
    fs.writeFileSync(CURRENT_VERSION_FILE, version);
    message.reply(`Node.js version switched to v${version}.`);
};

const listVersions = (message) => {
    const versions = fs.readdirSync(NODE_VERSIONS_DIR).filter(v => v.startsWith('node-v')).map(v => v.replace('node-v', ''));
    const currentVersion = fs.existsSync(CURRENT_VERSION_FILE) ? fs.readFileSync(CURRENT_VERSION_FILE, 'utf-8') : null;
    const versionList = versions.map(v => `${v} ${v === currentVersion ? '(current)' : ''}`).join('\n');
    message.reply(`Installed Node.js versions:\n${versionList}`);
};

const removeVersion = (version, message) => {
    const versionDir = path.resolve(NODE_VERSIONS_DIR, `node-v${version}`);
    if (fs.existsSync(versionDir)) {
        fs.rmdirSync(versionDir, { recursive: true });
        if (fs.existsSync(CURRENT_VERSION_FILE) && fs.readFileSync(CURRENT_VERSION_FILE, 'utf-8') === version) {
            fs.unlinkSync(CURRENT_VERSION_FILE);
        }
        message.reply(`Node.js version v${version} removed successfully.`);
    } else {
        message.reply(`Node.js version v${version} is not installed.`);
    }
};

module.exports = {
    config: {
        name: "nvm",
        version: "1.0b",
        author: "Priyanshi Kaur",
        description: {
            en: "Manage Node.js versions directly through the bot.",
        },
        guide: {
            en: "{pn} <command> <version>",
        },
        category: "system",
    },
    onStart: async function ({ api, message, args }) {
        const [command, version] = args;
        api.setMessageReaction("⌛", message.messageID, () => { }, true);

        try {
            switch (command) {
                case 'install':
                    if (!version) return message.reply('Please specify a version to install.');
                    await downloadNode(version, message);
                    break;
                case 'use':
                    if (!version) return message.reply('Please specify a version to use.');
                    setVersion(version, message);
                    break;
                case 'list':
                    listVersions(message);
                    break;
                case 'remove':
                    if (!version) return message.reply('Please specify a version to remove.');
                    removeVersion(version, message);
                    break;
                default:
                    message.reply('Invalid command. Use "install", "use", "list", or "remove".');
                    break;
            }
            api.setMessageReaction("✅", message.messageID, () => { }, true);
        } catch (error) {
            message.reply(`Error: ${error.message}`);
            api.setMessageReaction("❌", message.messageID, () => { }, true);
        }
    },
};