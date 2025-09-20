import { NextResponse } from "next/server";
import os from "node:os";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

type ToolCheck = {
  id: string;
  label: string;
  commands: string[];
};

type ToolResult = {
  id: string;
  label: string;
  installed: boolean;
  version: string | null;
  output: string | null;
  error: string | null;
};

type SystemInfo = {
  hostname: string;
  platform: NodeJS.Platform;
  release: string;
  arch: string;
  cpuModel: string | null;
  cpuCores: number;
  cpuSpeedGHz: number | null;
  totalMemBytes: number;
  freeMemBytes: number;
  uptimeSeconds: number;
  loadAverage: number[];
};

const TOOL_CHECKS: ToolCheck[] = [
  {
    id: "node",
    label: "Node.js",
    commands: ["node --version", "node -v"],
  },
  {
    id: "python",
    label: "Python",
    commands: ["python3 --version", "python --version"],
  },
  {
    id: "next",
    label: "Next.js",
    commands: ["npx --yes next --version", "npx next --version"],
  },
  {
    id: "shadcn",
    label: "shadcn/ui",
    commands: ["npx --yes shadcn@latest --version", "npx shadcn@latest --version"],
  },
  {
    id: "tailwind",
    label: "Tailwind CSS",
    commands: ["npx tailwindcss --version"],
  },
  {
    id: "fastapi",
    label: "FastAPI",
    commands: [
      "python3 -c \"import fastapi, sys; sys.stdout.write(fastapi.__version__)\"",
      "python -c \"import fastapi, sys; sys.stdout.write(fastapi.__version__)\"",
    ],
  },
  {
    id: "pnpm",
    label: "pnpm",
    commands: ["pnpm --version"],
  },
];

const VERSION_REGEX = /v?\d+(?:\.\d+){1,2}/i;

const extractVersion = (raw: string | null): string | null => {
  if (!raw) {
    return null;
  }

  const match = raw.match(VERSION_REGEX);
  return match ? match[0] : raw.trim() || null;
};

async function runToolCheck(tool: ToolCheck): Promise<ToolResult> {
  for (const command of tool.commands) {
    try {
      const { stdout, stderr } = await execAsync(command, {
        encoding: "utf8",
        maxBuffer: 1024 * 1024,
      });

      const combinedOutput = `${stdout}${stderr}`.trim();

      return {
        ...tool,
        installed: true,
        version: extractVersion(combinedOutput),
        output: combinedOutput || null,
        error: null,
      };
    } catch (error) {
      const err = error as { stderr?: string; message: string };

      if (command === tool.commands[tool.commands.length - 1]) {
        const combinedOutput = err.stderr?.trim() ?? null;

        return {
          ...tool,
          installed: false,
          version: null,
          output: combinedOutput,
          error: err.message,
        };
      }
    }
  }

  return {
    ...tool,
    installed: false,
    version: null,
    output: null,
    error: "No commands executed",
  };
}

const getSystemInfo = (): SystemInfo => {
  const cpus = os.cpus();
  const primaryCpu = cpus?.[0];

  return {
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    cpuModel: primaryCpu?.model ?? null,
    cpuCores: cpus?.length ?? 0,
    cpuSpeedGHz: primaryCpu ? primaryCpu.speed / 1000 : null,
    totalMemBytes: os.totalmem(),
    freeMemBytes: os.freemem(),
    uptimeSeconds: os.uptime(),
    loadAverage: os.loadavg(),
  };
};

export async function GET() {
  const results = await Promise.all(TOOL_CHECKS.map(runToolCheck));

  return NextResponse.json({
    results,
    system: getSystemInfo(),
  });
}
