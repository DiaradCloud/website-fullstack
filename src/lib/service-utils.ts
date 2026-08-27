import { DAYS_PER_MONTH } from "@/lib/constants";

export type ServiceLike = {
  id: string;
  name: string;
  ip: string | null;
  os: string;
  ssh_username: string;
  ssh_port: number;
  status: string;
  intl_enabled: boolean;
  bandwidth_gb: number;
  bandwidth_used_gb: number;
  starts_at: string | null;
  expires_at: string | null;
};

export function daysLeft(expiresAt: string | null): number {
  if (!expiresAt) return DAYS_PER_MONTH;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export function bandwidthRatio(used: number, total: number): number {
  if (!total) return 0;
  return Math.min(1, used / total);
}

export function sshCommand(service: {
  ssh_username: string;
  ip: string | null;
  ssh_port: number;
}): string {
  return `ssh ${service.ssh_username}@${service.ip ?? "—"} -p ${service.ssh_port}`;
}
