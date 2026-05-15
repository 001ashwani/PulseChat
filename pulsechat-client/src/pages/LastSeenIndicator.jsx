import { useMemo } from 'react';

/**
 * LastSeenIndicator Component
 * Displays when a user was last seen or if they're currently online
 * Formats the timestamp into a human-readable format
 */
export default function LastSeenIndicator({ timestamp, isOnline = false }) {
  const displayText = useMemo(() => {
    if (isOnline) {
      return 'Online';
    }

    if (!timestamp) {
      return 'Offline';
    }

    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diffMs = now - lastSeen;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Less than 1 minute ago
    if (diffMins === 0) {
      return 'Just now';
    }

    // Less than 1 hour ago
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }

    // Less than 24 hours ago
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    // Less than 7 days ago
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    // More than 7 days ago - show date
    return lastSeen.toLocaleDateString();
  }, [timestamp, isOnline]);

  return (
    <span className={`text-xs ${isOnline ? 'text-green-500 font-semibold' : 'text-gray-400'}`}>
      Last seen {displayText}
    </span>
  );
}
