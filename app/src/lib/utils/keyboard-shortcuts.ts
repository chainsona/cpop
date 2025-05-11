/**
 * Utility functions for keyboard shortcuts
 */

/**
 * Get the modifier key based on the operating system
 */
export function getModifierKey(os: string): string {
  if (os === 'macos' || os === 'ios') {
    return '⌘';
  } else {
    return 'Alt';
  }
}

/**
 * Get keyboard shortcut display text with the appropriate modifier key
 */
export function getShortcutDisplayText(key: string, os: string): string {
  return `${getModifierKey(os)}+${key.toUpperCase()}`;
} 