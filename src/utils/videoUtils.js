import VideoSourceManager from "./VideoSourceManager.js";

/**
 * Utility functions for video management
 */

let videoSourceManager = null;

/**
 * Get or create a VideoSourceManager instance
 * @returns {VideoSourceManager}
 */
export const getVideoSourceManager = () => {
  if (!videoSourceManager) {
    videoSourceManager = new VideoSourceManager();
  }
  return videoSourceManager;
};

/**
 * Get optimal video sources for current device
 * @returns {Array} Array of video source objects
 */
export const getOptimalVideoSources = () => {
  const manager = getVideoSourceManager();
  return manager.getOptimalVideoSources();
};

/**
 * Get device capabilities
 * @returns {Object} Device capabilities object
 */
export const getDeviceCapabilities = () => {
  const manager = getVideoSourceManager();
  return manager.deviceCapabilities;
};

/**
 * Get preload strategy for current device
 * @returns {string} Preload strategy ('none', 'metadata', 'auto')
 */
export const getPreloadStrategy = () => {
  const manager = getVideoSourceManager();
  return manager.getPreloadStrategy();
};

/**
 * Update video source manager when window resizes or orientation changes
 */
export const updateVideoCapabilities = () => {
  if (videoSourceManager) {
    videoSourceManager.updateCapabilities();
  }
};

/**
 * Log debug information about video selection
 */
export const logVideoDebugInfo = () => {
  const manager = getVideoSourceManager();
  manager.logDebugInfo();
};

/**
 * Check if device supports WebM format
 * @returns {boolean}
 */
export const supportsWebM = () => {
  const manager = getVideoSourceManager();
  return manager.supportsWebM();
};

/**
 * Check if device supports hardware acceleration
 * @returns {boolean}
 */
export const supportsHardwareAcceleration = () => {
  const manager = getVideoSourceManager();
  return manager.supportsHardwareAcceleration();
};

/**
 * Get video codec support information
 * @returns {Array} Array of supported codec names
 */
export const getVideoCodecSupport = () => {
  const manager = getVideoSourceManager();
  return manager.getVideoCodecSupport();
};

/**
 * Create video source elements for HTML video tag
 * @param {Array} sources - Array of video source objects
 * @returns {Array} Array of source element props
 */
export const createVideoSourceElements = (sources) => {
  return sources.map((source, index) => ({
    key: index,
    src: source.src,
    type: source.type,
    "data-quality": source.quality,
    "data-resolution": source.resolution,
  }));
};

/**
 * Get mobile-optimized video attributes
 * @returns {Object} Video attributes optimized for mobile devices
 */
export const getMobileOptimizedVideoAttributes = () => {
  const manager = getVideoSourceManager();
  return manager.getMobileOptimizedVideoAttributes();
};

/**
 * Get CSS classes for mobile optimizations
 * @returns {Array} Array of CSS class names for mobile optimizations
 */
export const getMobileOptimizationClasses = () => {
  const manager = getVideoSourceManager();
  return manager.getMobileOptimizationClasses();
};

/**
 * Initialize battery monitoring for mobile optimization
 * @returns {Promise} Promise that resolves when battery monitoring is initialized
 */
export const initializeBatteryMonitoring = async () => {
  const manager = getVideoSourceManager();
  return manager.initializeBatteryMonitoring();
};

/**
 * Check if device is low-end and needs performance optimizations
 * @returns {boolean}
 */
export const isLowEndDevice = () => {
  const manager = getVideoSourceManager();
  return manager.isLowEndDevice();
};

/**
 * Check if device is running a mobile operating system
 * @returns {boolean}
 */
export const isMobileOS = () => {
  const manager = getVideoSourceManager();
  return manager.isMobileOS();
};

/**
 * Get browser engine information for optimization
 * @returns {string} Browser engine name
 */
export const getBrowserEngine = () => {
  const manager = getVideoSourceManager();
  return manager.getBrowserEngine();
};

/**
 * Setup window event listeners for video capability updates
 */
export const setupVideoEventListeners = () => {
  // Update capabilities on window resize
  window.addEventListener("resize", updateVideoCapabilities);

  // Update capabilities on orientation change with iOS Safari specific handling
  const handleOrientationChange = () => {
    // iOS Safari needs longer delay for proper viewport calculation
    const delay = navigator.userAgent.includes('Safari') && navigator.userAgent.includes('Mobile') ? 300 : 100;
    setTimeout(updateVideoCapabilities, delay);
  };

  window.addEventListener("orientationchange", handleOrientationChange);

  // iOS Safari specific viewport change handling
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", updateVideoCapabilities);
  }

  // Cleanup function
  return () => {
    window.removeEventListener("resize", updateVideoCapabilities);
    window.removeEventListener("orientationchange", handleOrientationChange);
    
    if (window.visualViewport) {
      window.visualViewport.removeEventListener("resize", updateVideoCapabilities);
    }
  };
};
