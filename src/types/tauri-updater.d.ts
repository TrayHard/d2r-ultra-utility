declare module "@tauri-apps/plugin-updater" {
  export type DownloadProgressCallback = (
    downloadedBytes: number,
    totalBytes: number,
  ) => void;

  export interface UpdateInfo {
    available: boolean;
    download: (onProgress?: DownloadProgressCallback) => Promise<void>;
    install: () => Promise<void>;
    version?: string;
    notes?: string;
    pub_date?: string;
    platforms?: Record<string, unknown>;

    // для обратной совместимости с некоторыми примерами
    downloadAndInstall?: (
      onProgress?: DownloadProgressCallback,
    ) => Promise<void>;
    manifest?: unknown;
    shouldInstall?: boolean;
    date?: string;
    body?: string;
  }

  export function check(): Promise<UpdateInfo | null>;
}

declare module "@tauri-apps/plugin-process" {
  export function relaunch(): Promise<void>;
}
