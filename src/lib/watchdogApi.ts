// src/lib/watchdogApi.ts - Purpose: typed client for Watchdog Flask API
export interface SystemStatusSuccess {
  status: "success";
  system_info: string;
  active_processes: string[];
  config_set: boolean;
}

export interface SystemStatusError {
  status: "error";
  message: string;
}

export type SystemStatusResponse = SystemStatusSuccess | SystemStatusError;

async function handleJsonResponse<T>(res: Response): Promise<T> {
  const json = (await res.json()) as unknown;
  if (!res.ok) {
    const errMsg =
      typeof (json as { message?: unknown })?.message === "string"
        ? (json as { message: string }).message
        : `HTTP ${res.status}`;
    throw new Error(errMsg);
  }
  return json as T;
}

export async function getSystemStatus(baseUrl: string): Promise<SystemStatusSuccess> {
  const res = await fetch(`${baseUrl}/get/system/status`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  const data = await handleJsonResponse<SystemStatusResponse>(res);
  if (data.status !== "success") {
    throw new Error((data as SystemStatusError).message || "Unknown error");
  }
  return data;
}

export async function setConfig(baseUrl: string, config: string): Promise<void> {
  const res = await fetch(`${baseUrl}/set/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config }),
  });
  await handleJsonResponse<{ status: "success" }>(res);
}

export async function startProcesses(baseUrl: string, processTypes: string[]): Promise<void> {
  const res = await fetch(`${baseUrl}/start/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ process_types: processTypes }),
  });
  await handleJsonResponse<{ status: "success" }>(res);
}

export async function stopProcesses(baseUrl: string, processTypes: string[]): Promise<void> {
  const res = await fetch(`${baseUrl}/stop/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ process_types: processTypes }),
  });
  await handleJsonResponse<{ status: "success" }>(res);
}


