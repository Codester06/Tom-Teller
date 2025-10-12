/**
 * Video configuration for different device types and quality levels
 */

export const VIDEO_QUALITY_TIERS = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high'
};

export const DEVICE_TYPES = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop'
};

export const CONNECTION_TYPES = {
  SLOW_2G: 'slow-2g',
  TWO_G: '2g',
  THREE_G: '3g',
  FOUR_G: '4g',
  WIFI: 'wifi'
};

/**
 * Video source configuration mapping
 * This configuration defines which video files to use for different scenarios
 * Currently using the existing background-video.mp4 as fallback for all qualities
 * until multiple resolution videos are available
 */
export const VIDEO_SOURCE_CONFIG = {
  [DEVICE_TYPES.MOBILE]: {
    [VIDEO_QUALITY_TIERS.HIGH]: {
      mp4: 'background-video.mp4',
      webm: 'background-video.webm',
      resolution: 'auto',
      bitrate: 'auto'
    },
    [VIDEO_QUALITY_TIERS.MEDIUM]: {
      mp4: 'background-video.mp4',
      webm: 'background-video.webm',
      resolution: 'auto',
      bitrate: 'auto'
    },
    [VIDEO_QUALITY_TIERS.LOW]: {
      mp4: 'background-video.mp4',
      webm: 'background-video.webm',
      resolution: 'auto',
      bitrate: 'auto'
    }
  },
  [DEVICE_TYPES.TABLET]: {
    [VIDEO_QUALITY_TIERS.HIGH]: {
      mp4: 'background-video.mp4',
      webm: 'background-video.webm',
      resolution: 'auto',
      bitrate: 'auto'
    },
    [VIDEO_QUALITY_TIERS.MEDIUM]: {
      mp4: 'background-video.mp4',
      webm: 'background-video.webm',
      resolution: 'auto',
      bitrate: 'auto'
    },
    [VIDEO_QUALITY_TIERS.LOW]: {
      mp4: 'background-video.mp4',
      webm: 'background-video.webm',
      resolution: 'auto',
      bitrate: 'auto'
    }
  },
  [DEVICE_TYPES.DESKTOP]: {
    [VIDEO_QUALITY_TIERS.HIGH]: {
      mp4: 'background-video.mp4',
      webm: 'background-video.webm',
      resolution: 'auto',
      bitrate: 'auto'
    },
    [VIDEO_QUALITY_TIERS.MEDIUM]: {
      mp4: 'background-video.mp4',
      webm: 'background-video.webm',
      resolution: 'auto',
      bitrate: 'auto'
    },
    [VIDEO_QUALITY_TIERS.LOW]: {
      mp4: 'background-video.mp4',
      webm: 'background-video.webm',
      resolution: 'auto',
      bitrate: 'auto'
    }
  }
};

/**
 * Quality selection rules based on connection speed and device type
 */
export const QUALITY_SELECTION_RULES = {
  [CONNECTION_TYPES.SLOW_2G]: VIDEO_QUALITY_TIERS.LOW,
  [CONNECTION_TYPES.TWO_G]: VIDEO_QUALITY_TIERS.LOW,
  [CONNECTION_TYPES.THREE_G]: {
    [DEVICE_TYPES.MOBILE]: VIDEO_QUALITY_TIERS.MEDIUM,
    [DEVICE_TYPES.TABLET]: VIDEO_QUALITY_TIERS.MEDIUM,
    [DEVICE_TYPES.DESKTOP]: VIDEO_QUALITY_TIERS.MEDIUM
  },
  [CONNECTION_TYPES.FOUR_G]: {
    [DEVICE_TYPES.MOBILE]: VIDEO_QUALITY_TIERS.MEDIUM,
    [DEVICE_TYPES.TABLET]: VIDEO_QUALITY_TIERS.HIGH,
    [DEVICE_TYPES.DESKTOP]: VIDEO_QUALITY_TIERS.HIGH
  },
  [CONNECTION_TYPES.WIFI]: {
    [DEVICE_TYPES.MOBILE]: VIDEO_QUALITY_TIERS.MEDIUM,
    [DEVICE_TYPES.TABLET]: VIDEO_QUALITY_TIERS.HIGH,
    [DEVICE_TYPES.DESKTOP]: VIDEO_QUALITY_TIERS.HIGH
  }
};

/**
 * Preload strategies based on device and connection
 */
export const PRELOAD_STRATEGIES = {
  CONSERVATIVE: 'none',
  METADATA: 'metadata',
  AGGRESSIVE: 'auto'
};

export const PRELOAD_RULES = {
  [DEVICE_TYPES.MOBILE]: {
    [CONNECTION_TYPES.SLOW_2G]: PRELOAD_STRATEGIES.CONSERVATIVE,
    [CONNECTION_TYPES.TWO_G]: PRELOAD_STRATEGIES.CONSERVATIVE,
    [CONNECTION_TYPES.THREE_G]: PRELOAD_STRATEGIES.METADATA,
    [CONNECTION_TYPES.FOUR_G]: PRELOAD_STRATEGIES.METADATA,
    [CONNECTION_TYPES.WIFI]: PRELOAD_STRATEGIES.METADATA
  },
  [DEVICE_TYPES.TABLET]: {
    [CONNECTION_TYPES.SLOW_2G]: PRELOAD_STRATEGIES.CONSERVATIVE,
    [CONNECTION_TYPES.TWO_G]: PRELOAD_STRATEGIES.CONSERVATIVE,
    [CONNECTION_TYPES.THREE_G]: PRELOAD_STRATEGIES.METADATA,
    [CONNECTION_TYPES.FOUR_G]: PRELOAD_STRATEGIES.AGGRESSIVE,
    [CONNECTION_TYPES.WIFI]: PRELOAD_STRATEGIES.AGGRESSIVE
  },
  [DEVICE_TYPES.DESKTOP]: {
    [CONNECTION_TYPES.SLOW_2G]: PRELOAD_STRATEGIES.CONSERVATIVE,
    [CONNECTION_TYPES.TWO_G]: PRELOAD_STRATEGIES.METADATA,
    [CONNECTION_TYPES.THREE_G]: PRELOAD_STRATEGIES.METADATA,
    [CONNECTION_TYPES.FOUR_G]: PRELOAD_STRATEGIES.AGGRESSIVE,
    [CONNECTION_TYPES.WIFI]: PRELOAD_STRATEGIES.AGGRESSIVE
  }
};

/**
 * Default fallback configuration
 */
export const DEFAULT_CONFIG = {
  baseUrl: '/assets/',
  fallbackVideo: 'background-video.mp4', // Current video as fallback
  posterImage: 'video-poster.jpg',
  enableDebugLogging: process.env.NODE_ENV === 'development'
};