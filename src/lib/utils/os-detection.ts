/**
 * Utility to detect the operating system of the current device
 */

export function getOperatingSystem(): 'macos' | 'windows' | 'linux' | 'ios' | 'android' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';

  const userAgent = window.navigator.userAgent;
  const platform = window.navigator.platform;

  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K', 'darwin'];
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];

  if (macosPlatforms.indexOf(platform) !== -1) {
    return 'macos';
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    return 'windows';
  } else if (/Linux/.test(platform)) {
    return 'linux';
  } else if (/iPhone|iPad|iPod/.test(userAgent)) {
    return 'ios';
  } else if (/Android/.test(userAgent)) {
    return 'android';
  }

  return 'unknown';
} 