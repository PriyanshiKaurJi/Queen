const os = require("os");
const fs = require("fs-extra");
const process = require("process");
const child_process = require('child_process');
const si = require('systeminformation');

function getCPUUsage() {
  const cpus = os.cpus();
  const cpuCount = cpus.length;
  const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
  const totalTick = cpus.reduce((acc, cpu) => 
    acc + Object.values(cpu.times).reduce((a, b) => a + b), 0);
  
  const avgIdle = totalIdle / cpuCount;
  const avgTotal = totalTick / cpuCount;
  return (100 - (avgIdle / avgTotal * 100)).toFixed(1);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getNetworkStats() {
  const interfaces = os.networkInterfaces();
  let totalRx = 0;
  let totalTx = 0;
  
  Object.values(interfaces).forEach(iface => {
    iface.forEach(details => {
      if (details.family === 'IPv4') {
        totalRx += details.internal ? 0 : details.rx || 0;
        totalTx += details.internal ? 0 : details.tx || 0;
      }
    });
  });
  
  return { rx: formatBytes(totalRx), tx: formatBytes(totalTx) };
}

function getProcessStats() {
  const stats = {
    pid: process.pid,
    memory: formatBytes(process.memoryUsage().heapUsed),
    uptime: process.uptime(),
    nodeVersion: process.version,
    npmVersion: child_process.execSync('npm -v').toString().trim(),
    threads: process.env.UV_THREADPOOL_SIZE || 4
  };
  return stats;
}

async function getDiskInfo() {
  const disk = await si.fsSize();
  return disk.map(d => ({
    fs: d.fs,
    size: formatBytes(d.size),
    used: formatBytes(d.used),
    available: formatBytes(d.available),
    use: d.use.toFixed(1)
  }));
}

module.exports = {
  config: {
    name: "system",
    aliases: ["sys"],
    author: "QueenMaker", // Priyanshi Kaur
    countDown: 5,
    role: 0,
    category: "system",
    longDescription: {
      en: "Advanced System Information with detailed hardware, software, and performance metrics",
    },
    guide: {
      en: `Use .system [option]
Options:
- full: Complete system information
- hardware: Hardware specifications
- software: Software and OS details
- network: Network statistics
- process: Process information
- disk: Storage information
- mini: Minimal overview`
    },
  },

  onStart: async function ({ api, event, args, threadsData, usersData }) {
    try {
      const loadingMessage = await api.sendMessage(
        "⚡ Gathering system information...", 
        event.threadID
      );

      const uptimeInSeconds = process.uptime();
      const days = Math.floor(uptimeInSeconds / (3600 * 24));
      const hours = Math.floor((uptimeInSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
      const seconds = Math.floor(uptimeInSeconds % 60);
      const uptimeFormatted = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memoryUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);
      
      const allUsers = await usersData.getAll() || [];
      const allThreads = await threadsData.getAll() || [];
      const userCount = allUsers.length;
      const threadCount = allThreads.length;
      
      const ping = Date.now() - loadingMessage.timestamp;
      const pingStatus = ping < 100 ? "🟢" : ping < 300 ? "🟡" : "🔴";

      const cpuInfo = os.cpus()[0];
      const networkStats = getNetworkStats();
      const processStats = getProcessStats();
      const diskInfo = await getDiskInfo();
      
      const currentDate = new Date().toLocaleString('en-US', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      let response = "";

      switch(args[0]?.toLowerCase()) {
        case "hardware":
          response = `
╭────── HARDWARE INFO ──────╮
💻 CPU Information
❯ Model: ${cpuInfo.model}
❯ Cores: ${os.cpus().length}
❯ Speed: ${cpuInfo.speed}MHz
❯ Load: ${getCPUUsage()}%
❯ Architecture: ${os.arch()}

💾 Memory Information
❯ Total: ${formatBytes(totalMem)}
❯ Used: ${formatBytes(usedMem)} (${memoryUsagePercent}%)
❯ Free: ${formatBytes(freeMem)}
❯ Swap: ${formatBytes(os.totalmem() - os.freemem())}
╰───────────────────────╯`;
          break;

        case "software":
          response = `
╭────── SOFTWARE INFO ──────╮
🖥️ Operating System
❯ Platform: ${os.platform()}
❯ Type: ${os.type()}
❯ Release: ${os.release()}
❯ Hostname: ${os.hostname()}

⚙️ Runtime Environment
❯ Node.js: ${processStats.nodeVersion}
❯ NPM: ${processStats.npmVersion}
❯ Process ID: ${processStats.pid}
❯ Thread Pool: ${processStats.threads}
╰───────────────────────╯`;
          break;

        case "network":
          response = `
╭────── NETWORK STATS ──────╮
📡 Network Information
❯ Hostname: ${os.hostname()}
❯ Download: ${networkStats.rx}
❯ Upload: ${networkStats.tx}
❯ Ping: ${ping}ms ${pingStatus}
❯ Uptime: ${uptimeFormatted}
╰───────────────────────╯`;
          break;

        case "process":
          response = `
╭────── PROCESS INFO ──────╮
⚡ Process Statistics
❯ PID: ${processStats.pid}
❯ Memory Usage: ${processStats.memory}
❯ Thread Pool Size: ${processStats.threads}
❯ Active Users: ${userCount}
❯ Active Threads: ${threadCount}
❯ Uptime: ${uptimeFormatted}
╰───────────────────────╯`;
          break;

        case "disk":
          response = `
╭────── STORAGE INFO ──────╮
💽 Disk Information
${diskInfo.map(d => `
❯ Filesystem: ${d.fs}
  Size: ${d.size}
  Used: ${d.used} (${d.use}%)
  Free: ${d.available}
`).join('\n')}
╰───────────────────────╯`;
          break;

        case "mini":
          response = `📊 System: ${os.type()} | CPU: ${getCPUUsage()}% | RAM: ${memoryUsagePercent}% | Uptime: ${uptimeFormatted}`;
          break;

        default:
          response = `
╭──────── SYSTEM MONITOR ────────╮

💻 Hardware Overview
❯ CPU: ${cpuInfo.model}
❯ Cores: ${os.cpus().length} (${getCPUUsage()}% Usage)
❯ Memory: ${formatBytes(totalMem)} (${memoryUsagePercent}% Used)
❯ Architecture: ${os.arch()}

🖥️ Software Environment
❯ OS: ${os.type()} ${os.release()}
❯ Platform: ${os.platform()}
❯ Node.js: ${processStats.nodeVersion}
❯ NPM: ${processStats.npmVersion}

📊 Performance Metrics
❯ Process Memory: ${processStats.memory}
❯ Thread Pool: ${processStats.threads}
❯ Network DL/UL: ${networkStats.rx}/${networkStats.tx}
❯ Ping: ${ping}ms ${pingStatus}

📈 Usage Statistics
❯ Active Users: ${userCount}
❯ Active Threads: ${threadCount}
❯ Uptime: ${uptimeFormatted}

⏰ System Time
❯ ${currentDate}

╰─────────────────────────────╯`;
      }

      await api.editMessage(response, loadingMessage.messageID);
      
    } catch (error) {
      console.error("System Monitor Error:", error);
      api.sendMessage(
        "⚠️ Error while gathering system information:\n" + error.message, 
        event.threadID
      );
    }
  }
};