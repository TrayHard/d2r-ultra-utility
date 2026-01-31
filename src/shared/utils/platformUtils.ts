/**
 * Cross-platform utilities for Diablo II Ultra Utility
 * Automatically detects OS and uses correct path separators
 */

// OS detection (without using deprecated navigator.platform)
export const isWindows = () => {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('win') || userAgent.includes('windows');
};

export const isUnixLike = () => {
  if (typeof window === 'undefined') return false;
  return !isWindows();
};

// Get path separator
export const getPathSeparator = () => {
  return isWindows() ? '\\' : '/';
};

// Normalize path for current OS
export const normalizePath = (path: string): string => {
  if (isWindows()) {
  // Replace / with \ for Windows
    return path.replace(/\//g, '\\');
  } else {
  // Replace \ with / for Linux
    return path.replace(/\\/g, '/');
  }
};

// Create path with correct separators
export const createPath = (...segments: string[]): string => {
  const separator = getPathSeparator();
  return segments.join(separator);
};

// Extract directory from path (cross-platform)
export const getDirectoryPath = (filePath: string): string => {
  const lastSlashIndex = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
  return lastSlashIndex > 0 ? filePath.substring(0, lastSlashIndex) : filePath;
};

// Create paths for game files with OS consideration
export const createGamePaths = (modRoot: string) => {
  const separator = getPathSeparator();
  return {
    locales: `${modRoot}${separator}local${separator}lng${separator}strings`,
    runeHighlight: `${modRoot}${separator}hd${separator}items${separator}misc${separator}rune`,
    keysHighlight: `${modRoot}${separator}hd${separator}items${separator}misc${separator}key`,
    hudPanel: `${modRoot}${separator}global${separator}ui${separator}layouts${separator}hudpanelhd.json`,
    video: `${modRoot}${separator}hd${separator}global${separator}video`
  };
};
