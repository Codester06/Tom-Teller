import { 
  VIDEO_SOURCE_CONFIG, 
  QUALITY_SELECTION_RULES, 
  PRELOAD_RULES,
  DEVICE_TYPES,
  CONNECTION_TYPES,
  VIDEO_QUALITY_TIERS,
  DEFAULT_CONFIG
} from '../config/videoConfig.js';

/**
 * VideoSourceManager - Manages video source selection based on device capabilities
 * and connection speed to optimize video playback performance
 */
class VideoSourceManager {
  constructor() {
    this.deviceType = this.detectDeviceType();
    this.connectionSpeed = this.estimateConnectionSpeed();
    this.deviceCapabilities = this.getDeviceCapabilities();
    this.baseUrl = process.env.REACT_APP_VIDEO_BASE_URL || DEFAULT_CONFIG.baseUrl;
  }

  /**
   * Get optimal video sources based on device capabilities
   * @returns {Array} Array of video sources in priority order
   */
  getOptimalVideoSources() {
    const baseUrl = process.env.REACT_APP_VIDEO_BASE_URL || '/assets/';
    const sources = [];

    // Determine quality based on device type and connection
    const quality = this.determineOptimalQuality();
    
    // Get device-specific video sources
    const deviceSources = this.getDeviceSpecificSources(baseUrl, quality);
    
    // Add MP4 sources (WebM sources are currently the same file)
    sources.push(...deviceSources.mp4);
    
    return sources;
  }

  /**
   * Detect device type based on screen size and user agent
   * @returns {string} 'mobile', 'tablet', or 'desktop'
   */
  detectDeviceType() {
    const width = window.innerWidth;
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Check for mobile devices first
    if (this.isMobileUserAgent(userAgent) || width <= 767) {
      return 'mobile';
    }
    
    // Check for tablet
    if (this.isTabletUserAgent(userAgent) || (width >= 768 && width <= 1199)) {
      return 'tablet';
    }
    
    // Default to desktop
    return 'desktop';
  }

  /**
   * Estimate connection speed using Navigator API
   * @returns {string} Connection type estimate
   */
  estimateConnectionSpeed() {
    // Use Network Information API if available
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      if (connection.effectiveType) {
        return connection.effectiveType; // '2g', '3g', '4g', etc.
      }
      
      if (connection.downlink) {
        // Convert Mbps to connection type
        if (connection.downlink >= 10) return '4g';
        if (connection.downlink >= 1.5) return '3g';
        if (connection.downlink >= 0.15) return '2g';
        return 'slow-2g';
      }
    }
    
    // Fallback: assume good connection for desktop, moderate for mobile
    return this.deviceType === 'desktop' ? '4g' : '3g';
  }

  /**
   * Get comprehensive device capabilities
   * @returns {Object} Device capabilities object
   */
  getDeviceCapabilities() {
    return {
      deviceType: this.deviceType,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1,
      connectionType: this.connectionSpeed,
      hardwareAcceleration: this.supportsHardwareAcceleration(),
      videoCodecSupport: this.getVideoCodecSupport(),
      isRetina: window.devicePixelRatio > 1,
      orientation: this.getOrientation(),
      touchSupport: 'ontouchstart' in window,
      batteryStatus: this.getBatteryStatus(),
      thermalState: this.getThermalState(),
      memoryInfo: this.getMemoryInfo(),
      isLowEndDevice: this.isLowEndDevice(),
      isMobileOS: this.isMobileOS(),
      browserEngine: this.getBrowserEngine()
    };
  }

  /**
   * Determine optimal video quality based on device and connection
   * @returns {string} 'low', 'medium', or 'high'
   */
  determineOptimalQuality() {
    const { deviceType, connectionType, pixelRatio } = this.deviceCapabilities;
    
    // Use configuration-based quality selection
    const qualityRule = QUALITY_SELECTION_RULES[connectionType];
    
    if (typeof qualityRule === 'string') {
      return qualityRule;
    }
    
    if (typeof qualityRule === 'object' && qualityRule[deviceType]) {
      let quality = qualityRule[deviceType];
      
      // Boost quality for high DPI mobile devices with good connection
      if (deviceType === DEVICE_TYPES.MOBILE && 
          pixelRatio > 2 && 
          (connectionType === CONNECTION_TYPES.FOUR_G || connectionType === CONNECTION_TYPES.WIFI) &&
          quality === VIDEO_QUALITY_TIERS.LOW) {
        quality = VIDEO_QUALITY_TIERS.MEDIUM;
      }
      
      return quality;
    }
    
    // Fallback to medium quality
    return VIDEO_QUALITY_TIERS.MEDIUM;
  }

  /**
   * Get device-specific video sources using configuration
   * @param {string} baseUrl - Base URL for video assets
   * @param {string} quality - Quality level
   * @returns {Object} Object with webm and mp4 source arrays
   */
  getDeviceSpecificSources(baseUrl, quality) {
    const sources = { webm: [], mp4: [] };
    const deviceConfig = VIDEO_SOURCE_CONFIG[this.deviceType];
    
    if (!deviceConfig) {
      console.warn(`No video configuration found for device type: ${this.deviceType}`);
      return this.getFallbackSources(baseUrl);
    }
    
    // Get primary quality sources
    const primaryConfig = deviceConfig[quality];
    if (primaryConfig) {
      // Only add WebM if it's different from MP4 (indicating WebM version exists)
      if (primaryConfig.webm !== primaryConfig.mp4) {
        sources.webm.push({
          src: `${baseUrl}${primaryConfig.webm}`,
          type: 'video/webm',
          quality: quality,
          resolution: primaryConfig.resolution,
          bitrate: primaryConfig.bitrate
        });
      }
      
      sources.mp4.push({
        src: `${baseUrl}${primaryConfig.mp4}`,
        type: 'video/mp4',
        quality: quality,
        resolution: primaryConfig.resolution,
        bitrate: primaryConfig.bitrate
      });
    }
    
    // Add fallback sources (lower quality) - but since we're using the same file for all qualities,
    // we don't need to add duplicates
    if (quality !== VIDEO_QUALITY_TIERS.LOW) {
      const fallbackQualities = this.getFallbackQualities(quality);
      fallbackQualities.forEach(fallbackQuality => {
        const fallbackConfig = deviceConfig[fallbackQuality];
        if (fallbackConfig && fallbackConfig.mp4 !== primaryConfig.mp4) {
          // Only add if it's a different file
          if (fallbackConfig.webm !== fallbackConfig.mp4 && fallbackConfig.webm !== primaryConfig.webm) {
            sources.webm.push({
              src: `${baseUrl}${fallbackConfig.webm}`,
              type: 'video/webm',
              quality: fallbackQuality,
              resolution: fallbackConfig.resolution,
              bitrate: fallbackConfig.bitrate
            });
          }
          
          if (fallbackConfig.mp4 !== primaryConfig.mp4) {
            sources.mp4.push({
              src: `${baseUrl}${fallbackConfig.mp4}`,
              type: 'video/mp4',
              quality: fallbackQuality,
              resolution: fallbackConfig.resolution,
              bitrate: fallbackConfig.bitrate
            });
          }
        }
      });
    }
    
    return sources;
  }

  /**
   * Get fallback qualities in order of preference
   * @param {string} currentQuality - Current quality level
   * @returns {Array} Array of fallback quality levels
   */
  getFallbackQualities(currentQuality) {
    const qualityOrder = [VIDEO_QUALITY_TIERS.HIGH, VIDEO_QUALITY_TIERS.MEDIUM, VIDEO_QUALITY_TIERS.LOW];
    const currentIndex = qualityOrder.indexOf(currentQuality);
    
    // Return qualities lower than current
    return qualityOrder.slice(currentIndex + 1);
  }

  /**
   * Get fallback sources when configuration is not available
   * @param {string} baseUrl - Base URL for video assets
   * @returns {Object} Object with webm and mp4 source arrays
   */
  getFallbackSources(baseUrl) {
    return {
      webm: [],
      mp4: [{
        src: `${baseUrl}${DEFAULT_CONFIG.fallbackVideo}`,
        type: 'video/mp4',
        quality: 'medium',
        resolution: 'unknown'
      }]
    };
  }

  /**
   * Check if device supports WebM format
   * @returns {boolean}
   */
  supportsWebM() {
    const video = document.createElement('video');
    return video.canPlayType('video/webm') !== '';
  }

  /**
   * Check if device supports hardware acceleration
   * @returns {boolean}
   */
  supportsHardwareAcceleration() {
    // Check for WebGL support as indicator of hardware acceleration
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get supported video codecs
   * @returns {Array} Array of supported codec strings
   */
  getVideoCodecSupport() {
    const video = document.createElement('video');
    const codecs = [];
    
    // Test common video codecs
    const codecTests = [
      { name: 'h264', type: 'video/mp4; codecs="avc1.42E01E"' },
      { name: 'webm-vp8', type: 'video/webm; codecs="vp8"' },
      { name: 'webm-vp9', type: 'video/webm; codecs="vp9"' },
      { name: 'av1', type: 'video/mp4; codecs="av01.0.05M.08"' }
    ];
    
    codecTests.forEach(codec => {
      if (video.canPlayType(codec.type) !== '') {
        codecs.push(codec.name);
      }
    });
    
    return codecs;
  }

  /**
   * Get current device orientation
   * @returns {string} 'portrait' or 'landscape'
   */
  getOrientation() {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }

  /**
   * Check if user agent indicates mobile device
   * @param {string} userAgent - User agent string
   * @returns {boolean}
   */
  isMobileUserAgent(userAgent) {
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    return mobileRegex.test(userAgent);
  }

  /**
   * Check if user agent indicates tablet device
   * @param {string} userAgent - User agent string
   * @returns {boolean}
   */
  isTabletUserAgent(userAgent) {
    const tabletRegex = /ipad|android(?!.*mobile)|tablet|kindle|silk/i;
    return tabletRegex.test(userAgent);
  }

  /**
   * Update device capabilities (call when window resizes or orientation changes)
   */
  updateCapabilities() {
    this.deviceType = this.detectDeviceType();
    this.connectionSpeed = this.estimateConnectionSpeed();
    this.deviceCapabilities = this.getDeviceCapabilities();
  }

  /**
   * Get preload strategy based on device and connection using configuration
   * @returns {string} 'none', 'metadata', or 'auto'
   */
  getPreloadStrategy() {
    const { deviceType, connectionType } = this.deviceCapabilities;
    
    const deviceRules = PRELOAD_RULES[deviceType];
    if (deviceRules && deviceRules[connectionType]) {
      return deviceRules[connectionType];
    }
    
    // Fallback to metadata preloading
    return 'metadata';
  }

  /**
   * Get battery status information for mobile optimization
   * @returns {Object} Battery status object
   */
  getBatteryStatus() {
    // Check if Battery API is available
    if ('getBattery' in navigator) {
      // Note: Battery API is deprecated but still used for optimization hints
      return {
        supported: true,
        level: null, // Will be populated asynchronously
        charging: null,
        dischargingTime: null
      };
    }
    
    return {
      supported: false,
      level: null,
      charging: null,
      dischargingTime: null
    };
  }

  /**
   * Get thermal state information (iOS Safari specific)
   * @returns {Object} Thermal state object
   */
  getThermalState() {
    // Check for iOS Safari thermal state API
    if ('webkitThermalState' in navigator) {
      return {
        supported: true,
        state: navigator.webkitThermalState || 'nominal'
      };
    }
    
    return {
      supported: false,
      state: 'unknown'
    };
  }

  /**
   * Get memory information for performance optimization
   * @returns {Object} Memory information object
   */
  getMemoryInfo() {
    // Check for Chrome's memory API
    if ('memory' in performance) {
      return {
        supported: true,
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }
    
    // Check for device memory API
    if ('deviceMemory' in navigator) {
      return {
        supported: true,
        deviceMemory: navigator.deviceMemory,
        approximateMemory: navigator.deviceMemory * 1024 // Convert GB to MB
      };
    }
    
    return {
      supported: false,
      deviceMemory: null,
      approximateMemory: null
    };
  }

  /**
   * Determine if device is low-end based on various factors
   * @returns {boolean}
   */
  isLowEndDevice() {
    const { screenWidth, pixelRatio } = this.deviceCapabilities || {};
    const memoryInfo = this.getMemoryInfo();
    
    // Check device memory (if available)
    if (memoryInfo.supported && memoryInfo.deviceMemory) {
      // Devices with less than 2GB RAM are considered low-end
      if (memoryInfo.deviceMemory < 2) {
        return true;
      }
    }
    
    // Check screen resolution and pixel ratio
    if (screenWidth && pixelRatio) {
      // Very low resolution or very high pixel ratio on small screens
      if (screenWidth < 360 || (screenWidth < 768 && pixelRatio > 2.5)) {
        return true;
      }
    }
    
    // Check hardware acceleration support
    if (!this.supportsHardwareAcceleration()) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if device is running a mobile operating system
   * @returns {boolean}
   */
  isMobileOS() {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();
    
    // Check for mobile OS patterns
    const mobileOSPatterns = [
      /android/,
      /iphone/,
      /ipad/,
      /ipod/,
      /windows phone/,
      /blackberry/,
      /webos/,
      /tizen/,
      /kaios/
    ];
    
    const mobilePlatformPatterns = [
      /iphone/,
      /ipad/,
      /ipod/,
      /android/,
      /arm/
    ];
    
    return mobileOSPatterns.some(pattern => pattern.test(userAgent)) ||
           mobilePlatformPatterns.some(pattern => pattern.test(platform));
  }

  /**
   * Get browser engine information for optimization
   * @returns {string}
   */
  getBrowserEngine() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('webkit') && userAgent.includes('chrome')) {
      return 'blink'; // Chrome, Edge, Opera
    } else if (userAgent.includes('webkit') && userAgent.includes('safari')) {
      return 'webkit'; // Safari
    } else if (userAgent.includes('gecko') && userAgent.includes('firefox')) {
      return 'gecko'; // Firefox
    } else if (userAgent.includes('trident') || userAgent.includes('edge')) {
      return 'edgehtml'; // Legacy Edge
    }
    
    return 'unknown';
  }

  /**
   * Get mobile-optimized video attributes based on device capabilities
   * @returns {Object} Video attributes object
   */
  getMobileOptimizedVideoAttributes() {
    const { deviceType, batteryStatus, thermalState, isLowEndDevice, isMobileOS, browserEngine } = this.deviceCapabilities;
    const attributes = {};
    
    if (deviceType === DEVICE_TYPES.MOBILE || isMobileOS) {
      // Basic mobile attributes
      attributes.playsInline = true;
      attributes.muted = true;
      attributes.autoPlay = true;
      attributes.loop = true;
      
      // iOS Safari specific attributes
      if (browserEngine === 'webkit') {
        attributes['webkit-playsinline'] = true;
        attributes['x-webkit-airplay'] = 'deny';
        attributes.controls = false;
      }
      
      // Android Chrome specific attributes
      if (browserEngine === 'blink') {
        attributes.preload = this.getPreloadStrategy();
      }
      
      // Battery-aware settings
      if (batteryStatus.supported && batteryStatus.level !== null) {
        if (batteryStatus.level < 0.2 && !batteryStatus.charging) {
          // Low battery: conservative settings
          attributes.preload = 'none';
          attributes.autoPlay = false;
        }
      }
      
      // Thermal state aware settings (iOS)
      if (thermalState.supported && thermalState.state !== 'nominal') {
        // Device is hot: reduce processing
        attributes.preload = 'none';
        if (thermalState.state === 'critical') {
          attributes.autoPlay = false;
        }
      }
      
      // Low-end device optimizations
      if (isLowEndDevice) {
        attributes.preload = 'none';
        attributes.poster = `${this.baseUrl}video-poster.jpg`;
      }
    }
    
    return attributes;
  }

  /**
   * Get CSS classes for mobile optimizations
   * @returns {Array} Array of CSS class names
   */
  getMobileOptimizationClasses() {
    const { batteryStatus, thermalState, isLowEndDevice } = this.deviceCapabilities;
    const classes = [];
    
    // Battery-aware classes
    if (batteryStatus.supported && batteryStatus.level !== null) {
      if (batteryStatus.level < 0.2 && !batteryStatus.charging) {
        classes.push('battery-saver');
      }
    }
    
    // Thermal state classes
    if (thermalState.supported && thermalState.state !== 'nominal') {
      classes.push('thermal-throttled');
      if (thermalState.state === 'critical') {
        classes.push('thermal-critical');
      }
    }
    
    // Performance classes
    if (isLowEndDevice) {
      classes.push('performance-mode');
    }
    
    return classes;
  }

  /**
   * Initialize battery monitoring for mobile optimization
   */
  async initializeBatteryMonitoring() {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        
        // Update battery status
        this.deviceCapabilities.batteryStatus = {
          supported: true,
          level: battery.level,
          charging: battery.charging,
          dischargingTime: battery.dischargingTime
        };
        
        // Set up battery event listeners
        battery.addEventListener('levelchange', () => {
          this.deviceCapabilities.batteryStatus.level = battery.level;
        });
        
        battery.addEventListener('chargingchange', () => {
          this.deviceCapabilities.batteryStatus.charging = battery.charging;
        });
        
      } catch (error) {
        console.warn('Battery API not available:', error);
      }
    }
  }

  /**
   * Log debug information about device capabilities and selected sources
   */
  logDebugInfo() {
    if (!DEFAULT_CONFIG.enableDebugLogging) return;
    
    console.group('VideoSourceManager Debug Info');
    console.log('Device Capabilities:', this.deviceCapabilities);
    console.log('Selected Quality:', this.determineOptimalQuality());
    console.log('Preload Strategy:', this.getPreloadStrategy());
    console.log('Mobile Optimizations:', this.getMobileOptimizationClasses());
    console.log('Video Attributes:', this.getMobileOptimizedVideoAttributes());
    console.log('Optimal Sources:', this.getOptimalVideoSources());
    console.groupEnd();
  }
}

export default VideoSourceManager;