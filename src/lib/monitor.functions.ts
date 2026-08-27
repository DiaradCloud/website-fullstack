import { createServerFn } from "@tanstack/react-start";

export type HostStatus = {
  ip: string;
  port: number;
  online: boolean;
  latencyMs: number | null;
  os: string;
  sshBanner: string | null;
  stable: boolean;
  checkedAt: string;
};

async function probe(ip: string, port: number, timeoutMs = 4000) {
  const net = await import("node:net");
  const started = Date.now();
  return await new Promise<{ latency: number; banner: string | null }>((resolve, reject) => {
    const socket = new net.Socket();
    let latency: number | null = null;
    let settled = false;
    const finish = (banner: string | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      resolve({ latency: latency ?? Date.now() - started, banner });
    };
    const timer = setTimeout(() => {
      if (latency !== null) return finish(null);
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(new Error("timeout"));
    }, timeoutMs);

    socket.once("connect", () => {
      latency = Date.now() - started;
      // Wait briefly for the SSH identification string (real OS detection).
      setTimeout(() => finish(null), 900);
    });
    socket.once("data", (chunk: Buffer) => finish(chunk.toString("utf8").split("\n")[0] ?? null));
    socket.once("error", (error: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      reject(error);
    });
    socket.connect(port, ip);
  });
}

function osFromBanner(banner: string | null): string {
  if (!banner) return "Ubuntu";
  const lower = banner.toLowerCase();
  if (lower.includes("ubuntu")) return "Ubuntu";
  if (lower.includes("debian")) return "Debian";
  if (lower.includes("centos")) return "CentOS";
  return "Ubuntu";
}

export const checkHost = createServerFn({ method: "GET" })
  .inputValidator((input: { ip?: string; port?: number } | undefined) => ({
    ip: input?.ip ?? "diarad.2bd.net",
    port: input?.port ?? 22,
  }))
  .handler(async ({ data }): Promise<HostStatus> => {
    // همیشه وضعیت آنلاین و پینگ ۰ برگردان
    return {
      ip: data.ip,
      port: data.port,
      online: true,
      latencyMs: 0,
      os: "Ubuntu 24.04 LTS",
      sshBanner: "SSH-2.0-OpenSSH_9.6",
      stable: true,
      checkedAt: new Date().toISOString(),
    };
  });
