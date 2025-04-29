/**
 * Formats an ISO date string into a human-readable format
 * @param isoDateString ISO date string (e.g., 2025-04-28T03:27:33.009Z)
 * @param includeTime Whether to include time in the formatted string
 * @returns Formatted date string
 */
export function formatDate(isoDateString: string, includeTime: boolean = false): string {
  if (!isoDateString) return '';
  
  try {
    const date = new Date(isoDateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Check if the date is today
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    // Check if the date is yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    // Options for formatting the time
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    if (isToday) {
      return includeTime 
        ? `Today at ${date.toLocaleTimeString(undefined, timeOptions)}`
        : 'Today';
    } else if (isYesterday) {
      return includeTime 
        ? `Yesterday at ${date.toLocaleTimeString(undefined, timeOptions)}`
        : 'Yesterday';
    } else {
      // For other dates, show the full date
      const dateOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      };
      
      if (includeTime) {
        return `${date.toLocaleDateString(undefined, dateOptions)} at ${date.toLocaleTimeString(undefined, timeOptions)}`;
      } else {
        return date.toLocaleDateString(undefined, dateOptions);
      }
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return isoDateString;
  }
}

/**
 * Formats a date as a relative time string (e.g., "2 hours ago", "3 days ago")
 * @param isoDateString ISO date string or Date object
 * @returns Relative time string
 */
export function getRelativeTime(isoDateString: string | Date): string {
  if (!isoDateString) return '';
  
  try {
    const date = isoDateString instanceof Date ? isoDateString : new Date(isoDateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffSecs < 60) {
      return diffSecs <= 1 ? 'just now' : `${diffSecs} seconds ago`;
    } else if (diffMins < 60) {
      return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;
    } else if (diffWeeks < 4) {
      return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
    } else if (diffMonths < 12) {
      return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
    } else {
      return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
    }
  } catch (error) {
    console.error('Error getting relative time:', error);
    return isoDateString.toString();
  }
} 