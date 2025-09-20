import { NextResponse } from "next/server";
import os from "node:os";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

type SystemInfo = {
  // 基本系统信息
  hostname: string;
  platform: string;
  platformVersion: string;
  arch: string;
  kernelVersion: string;

  // CPU信息
  cpuModel: string | null;
  cpuCores: number;
  cpuSpeedGHz: number | null;
  cpuUsagePercent: number | null;

  // 内存信息
  totalMemGB: string;
  freeMemGB: string;
  usedMemGB: string;
  memUsagePercent: number;

  // 系统运行时间
  uptimeDays: number;
  uptimeHours: number;
  uptimeMinutes: number;

  // 负载平均值
  loadAverage: number[];

  // 网络接口
  networkInterfaces: { name: string; address: string; type: string }[];

  // Node.js信息
  nodeVersion: string;
  nodeMemoryUsageMB: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
};

const getSystemInfo = async (): Promise<SystemInfo> => {
  const cpus = os.cpus();
  const primaryCpu = cpus?.[0];
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const uptime = os.uptime();

  // 获取更详细的系统信息
  let platformVersion = "";
  const kernelVersion = os.release();

  try {
    if (os.platform() === "darwin") {
      const { stdout } = await execAsync("sw_vers -productVersion");
      platformVersion = `macOS ${stdout.trim()}`;
    } else if (os.platform() === "linux") {
      const { stdout } = await execAsync("cat /etc/os-release | grep PRETTY_NAME | cut -d'=' -f2 | tr -d '\"'");
      platformVersion = stdout.trim();
    } else if (os.platform() === "win32") {
      const { stdout } = await execAsync("ver");
      platformVersion = stdout.trim();
    }
  } catch {
    platformVersion = `${os.platform()} ${os.release()}`;
  }

  // 计算CPU使用率
  const cpuUsagePercent = cpus.reduce((acc, cpu) => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
    const idle = cpu.times.idle;
    return acc + ((total - idle) / total) * 100;
  }, 0) / cpus.length;

  // 获取网络接口信息
  const nets = os.networkInterfaces();
  const networkInterfaces: { name: string; address: string; type: string }[] = [];

  for (const [name, interfaces] of Object.entries(nets)) {
    if (interfaces) {
      for (const iface of interfaces) {
        if (!iface.internal) {
          networkInterfaces.push({
            name,
            address: iface.address,
            type: iface.family,
          });
        }
      }
    }
  }

  // Node.js进程信息
  const memUsage = process.memoryUsage();

  return {
    hostname: os.hostname(),
    platform: os.platform(),
    platformVersion,
    arch: os.arch(),
    kernelVersion,

    cpuModel: primaryCpu?.model ?? null,
    cpuCores: cpus?.length ?? 0,
    cpuSpeedGHz: primaryCpu ? Number((primaryCpu.speed / 1000).toFixed(2)) : null,
    cpuUsagePercent: Number(cpuUsagePercent.toFixed(2)),

    totalMemGB: (totalMem / 1024 / 1024 / 1024).toFixed(2),
    freeMemGB: (freeMem / 1024 / 1024 / 1024).toFixed(2),
    usedMemGB: (usedMem / 1024 / 1024 / 1024).toFixed(2),
    memUsagePercent: Number(((usedMem / totalMem) * 100).toFixed(2)),

    uptimeDays: Math.floor(uptime / 86400),
    uptimeHours: Math.floor((uptime % 86400) / 3600),
    uptimeMinutes: Math.floor((uptime % 3600) / 60),

    loadAverage: os.loadavg().map(load => Number(load.toFixed(2))),

    networkInterfaces,

    nodeVersion: process.version,
    nodeMemoryUsageMB: {
      rss: Number((memUsage.rss / 1024 / 1024).toFixed(2)),
      heapTotal: Number((memUsage.heapTotal / 1024 / 1024).toFixed(2)),
      heapUsed: Number((memUsage.heapUsed / 1024 / 1024).toFixed(2)),
      external: Number((memUsage.external / 1024 / 1024).toFixed(2)),
    },
  };
};

export async function GET() {
  try {
    const systemInfo = await getSystemInfo();
    return NextResponse.json(systemInfo);
  } catch {
    return NextResponse.json(
      { error: "Failed to get system information" },
      { status: 500 }
    );
  }
}
