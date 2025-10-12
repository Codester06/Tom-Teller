/**
 * VideoErrorHandler - Comprehensive error handling and fallback system for video playback
 * Handles network errors, codec compatibility, performance monitoring, and graceful degradation
 */

export const ERROR_TYPES = {
  NETWORK_ERROR: 'network_error',
  CODEC_ERROR: 'codec_error',
  PERFORMANCE_ERROR: 'performance_error',
  LOADING_ERROR: 'loading_error',
  PLAYBACK_ERROR: 'playback_error',
  TIMEOUT_ERROR: 'timeout_error'
};

export const FALLBACK_STRATEGIES = {
  RETRY: 'retry',
  REDUCE_QUALITY: 'reduce_quality',
  STATIC_BACKGROUND: 'static_background',
  DISABLE_VIDEO: 'disable_video'
};

class VideoErrorHandler {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.performanceThreshold = options.performanceThreshold || 5000; // 5 seconds
    this.networkTimeout = options.networkTimeout || 10000; // 10 seconds
    this.enableLogging = options.enableLogging || false;
    
    // Error tracking
    this.errorHistory = [];
    this.retryCount = 0;
    this.performanceMetrics = {
      loadStartTime: null,
      firstFrameTime: null,
      stallCount: 0,
      bufferingTime: 0
    };
    
    // Network monitoring
    this.networkMonitor = new NetworkMonitor();
    this.performanceMonitor = new PerformanceMonitor();
  }

  /**
   * Handle video loading error with appropriate fallback strategy
   * @param {Error} error - The error that occurred
   * @param {Object} context - Context information (video element, sources, etc.)
   * @returns {Promise<Object>} Recovery action to take
   */
  async handleError(error, context = {}) {
    const errorType = this.classifyError(error, context);
    const errorInfo = {
      type: errorType,
      error,
      context,
      timestamp: Date.now(),
      retryCount: this.retryCount
    };
    
    this.logError(errorInfo);
    this.errorHistory.push(errorInfo);
    
    // Determine recovery strategy based on error type and history
    const strategy = await this.determineRecoveryStrategy(errorInfo);
    
    return this.executeRecoveryStrategy(strategy, errorInfo);
  }

  /**
   * Classify the type of error that occurred
   * @param {Error} error - The error object
   * @param {Object} context - Context information
   * @returns {string} Error type classification
   */
  classifyError(error, context) {
    const { videoElement, networkInfo } = context;
    
    // Network-related errors
    if (this.isNetworkError(error, networkInfo)) {
      return ERROR_TYPES.NETWORK_ERROR;
    }
    
    // Codec compatibility errors
    if (this.isCodecError(error, videoElement)) {
      return ERROR_TYPES.CODEC_ERROR;
    }
    
    // Performance-related errors
    if (this.isPerformanceError(error, context)) {
      return ERROR_TYPES.PERFORMANCE_ERROR;
    }
    
    // Loading timeout errors
    if (this.isTimeoutError(error, context)) {
      return ERROR_TYPES.TIMEOUT_ERROR;
    }
    
    // Playback errors
    if (videoElement && videoElement.error) {
      return ERROR_TYPES.PLAYBACK_ERROR;
    }
    
    // Default to loading error
    return ERROR_TYPES.LOADING_ERROR;
  }

  /**
   * Check if error is network-related
   * @param {Error} error - The error object
   * @param {Object} networkInfo - Network information
   * @returns {boolean}
   */
  isNetworkError(error, networkInfo) {
    // Check error message for network indicators
    const networkErrorPatterns = [
      /network/i,
      /connection/i,
      /timeout/i,
      /fetch/i,
      /cors/i,
      /net::/i
    ];
    
    const errorMessage = error.message || error.toString();
    const hasNetworkPattern = networkErrorPatterns.some(pattern => 
      pattern.test(errorMessage)
    );
    
    // Check network status
    const isOffline = !navigator.onLine;
    const hasSlowConnection = networkInfo && networkInfo.effectiveType === 'slow-2g';
    
    return hasNetworkPattern || isOffline || hasSlowConnection;
  }

  /**
   * Check if error is codec-related
   * @param {Error} error - The error object
   * @param {HTMLVideoElement} videoElement - Video element
   * @returns {boolean}
   */
  isCodecError(error, videoElement) {
    if (!videoElement) return false;
    
    // Check video element error codes
    if (videoElement.error) {
      const { code } = videoElement.error;
      // MEDIA_ERR_SRC_NOT_SUPPORTED or MEDIA_ERR_DECODE
      return code === 4 || code === 3;
    }
    
    // Check error message for codec indicators
    const codecErrorPatterns = [
      /codec/i,
      /format/i,
      /decode/i,
      /unsupported/i,
      /media_err_src_not_supported/i,
      /media_err_decode/i
    ];
    
    const errorMessage = error.message || error.toString();
    return codecErrorPatterns.some(pattern => pattern.test(errorMessage));
  }

  /**
   * Check if error is performance-related
   * @param {Error} error - The error object
   * @param {Object} context - Context information
   * @returns {boolean}
   */
  isPerformanceError(error, context) {
    const { loadTime, stallCount } = context;
    
    // Check if loading took too long
    if (loadTime && loadTime > this.performanceThreshold) {
      return true;
    }
    
    // Check for excessive stalling
    if (stallCount && stallCount > 3) {
      return true;
    }
    
    // Check memory pressure
    if (this.performanceMonitor.isMemoryPressureHigh()) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if error is timeout-related
   * @param {Error} error - The error object
   * @param {Object} context - Context information
   * @returns {boolean}
   */
  isTimeoutError(error, context) {
    const { loadTime } = context;
    const errorMessage = error.message || error.toString();
    
    return (
      /timeout/i.test(errorMessage) ||
      (loadTime && loadTime > this.networkTimeout)
    );
  }

  /**
   * Determine the best recovery strategy based on error type and history
   * @param {Object} errorInfo - Error information object
   * @returns {Promise<string>} Recovery strategy
   */
  async determineRecoveryStrategy(errorInfo) {
    const { type, retryCount } = errorInfo;
    
    // Check if we've exceeded retry limits
    if (retryCount >= this.maxRetries) {
      return this.getFinalFallbackStrategy(type);
    }
    
    // Strategy based on error type
    switch (type) {
      case ERROR_TYPES.NETWORK_ERROR:
        return await this.getNetworkErrorStrategy(errorInfo);
      
      case ERROR_TYPES.CODEC_ERROR:
        return FALLBACK_STRATEGIES.REDUCE_QUALITY;
      
      case ERROR_TYPES.PERFORMANCE_ERROR:
        return FALLBACK_STRATEGIES.REDUCE_QUALITY;
      
      case ERROR_TYPES.TIMEOUT_ERROR:
        return FALLBACK_STRATEGIES.RETRY;
      
      case ERROR_TYPES.PLAYBACK_ERROR:
      case ERROR_TYPES.LOADING_ERROR:
      default:
        return retryCount < 2 ? FALLBACK_STRATEGIES.RETRY : FALLBACK_STRATEGIES.REDUCE_QUALITY;
    }
  }

  /**
   * Get network error recovery strategy
   * @param {Object} errorInfo - Error information
   * @returns {Promise<string>} Recovery strategy
   */
  async getNetworkErrorStrategy(errorInfo) {
    const networkStatus = await this.networkMonitor.checkNetworkStatus();
    
    if (!networkStatus.isOnline) {
      return FALLBACK_STRATEGIES.STATIC_BACKGROUND;
    }
    
    if (networkStatus.isSlowConnection) {
      return FALLBACK_STRATEGIES.REDUCE_QUALITY;
    }
    
    return FALLBACK_STRATEGIES.RETRY;
  }

  /**
   * Get final fallback strategy when retries are exhausted
   * @param {string} errorType - Type of error
   * @returns {string} Final fallback strategy
   */
  getFinalFallbackStrategy(errorType) {
    switch (errorType) {
      case ERROR_TYPES.NETWORK_ERROR:
        return FALLBACK_STRATEGIES.STATIC_BACKGROUND;
      
      case ERROR_TYPES.CODEC_ERROR:
        return FALLBACK_STRATEGIES.STATIC_BACKGROUND;
      
      case ERROR_TYPES.PERFORMANCE_ERROR:
        return FALLBACK_STRATEGIES.DISABLE_VIDEO;
      
      default:
        return FALLBACK_STRATEGIES.STATIC_BACKGROUND;
    }
  }

  /**
   * Execute the determined recovery strategy
   * @param {string} strategy - Recovery strategy to execute
   * @param {Object} errorInfo - Error information
   * @returns {Promise<Object>} Recovery action details
   */
  async executeRecoveryStrategy(strategy, errorInfo) {
    const action = {
      strategy,
      timestamp: Date.now(),
      errorInfo
    };
    
    switch (strategy) {
      case FALLBACK_STRATEGIES.RETRY:
        action.delay = this.calculateRetryDelay();
        this.retryCount++;
        break;
      
      case FALLBACK_STRATEGIES.REDUCE_QUALITY:
        action.qualityReduction = await this.calculateQualityReduction(errorInfo);
        break;
      
      case FALLBACK_STRATEGIES.STATIC_BACKGROUND:
        action.fallbackType = 'static';
        break;
      
      case FALLBACK_STRATEGIES.DISABLE_VIDEO:
        action.fallbackType = 'disabled';
        break;
    }
    
    this.logRecoveryAction(action);
    return action;
  }

  /**
   * Calculate retry delay with exponential backoff
   * @returns {number} Delay in milliseconds
   */
  calculateRetryDelay() {
    const baseDelay = this.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, this.retryCount);
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    
    return Math.min(exponentialDelay + jitter, 10000); // Cap at 10 seconds
  }

  /**
   * Calculate quality reduction based on error context
   * @param {Object} errorInfo - Error information
   * @returns {Promise<Object>} Quality reduction details
   */
  async calculateQualityReduction(errorInfo) {
    const { type, context } = errorInfo;
    const currentQuality = context.currentQuality || 'high';
    
    const qualityLevels = ['high', 'medium', 'low'];
    const currentIndex = qualityLevels.indexOf(currentQuality);
    
    let targetQuality = currentQuality;
    let reductionReason = 'error_recovery';
    
    if (type === ERROR_TYPES.PERFORMANCE_ERROR) {
      // Aggressive quality reduction for performance issues
      targetQuality = currentIndex < qualityLevels.length - 1 ? 
        qualityLevels[currentIndex + 1] : 'low';
      reductionReason = 'performance_optimization';
    } else if (type === ERROR_TYPES.NETWORK_ERROR) {
      // Conservative quality reduction for network issues
      const networkStatus = await this.networkMonitor.checkNetworkStatus();
      if (networkStatus.isSlowConnection) {
        targetQuality = 'low';
        reductionReason = 'network_optimization';
      } else {
        targetQuality = currentIndex < qualityLevels.length - 1 ? 
          qualityLevels[currentIndex + 1] : currentQuality;
      }
    }
    
    return {
      from: currentQuality,
      to: targetQuality,
      reason: reductionReason,
      networkStatus: await this.networkMonitor.checkNetworkStatus()
    };
  }

  /**
   * Reset error handler state for new video loading attempt
   */
  reset() {
    this.retryCount = 0;
    this.performanceMetrics = {
      loadStartTime: null,
      firstFrameTime: null,
      stallCount: 0,
      bufferingTime: 0
    };
  }

  /**
   * Start performance monitoring for video loading
   */
  startPerformanceMonitoring() {
    this.performanceMetrics.loadStartTime = Date.now();
    this.performanceMonitor.startMonitoring();
  }

  /**
   * Record successful video load
   * @param {Object} metrics - Load metrics
   */
  recordSuccessfulLoad(metrics = {}) {
    const loadTime = Date.now() - (this.performanceMetrics.loadStartTime || Date.now());
    
    this.performanceMetrics.firstFrameTime = loadTime;
    this.performanceMonitor.recordLoadSuccess({
      loadTime,
      ...metrics
    });
    
    // Reset retry count on successful load
    this.retryCount = 0;
  }

  /**
   * Log error information
   * @param {Object} errorInfo - Error information to log
   */
  logError(errorInfo) {
    if (!this.enableLogging) return;
    
    console.warn('VideoErrorHandler: Error occurred', {
      type: errorInfo.type,
      message: errorInfo.error.message,
      retryCount: errorInfo.retryCount,
      timestamp: new Date(errorInfo.timestamp).toISOString()
    });
  }

  /**
   * Log recovery action
   * @param {Object} action - Recovery action to log
   */
  logRecoveryAction(action) {
    if (!this.enableLogging) return;
    
    console.log('VideoErrorHandler: Recovery action', {
      strategy: action.strategy,
      timestamp: new Date(action.timestamp).toISOString(),
      details: action
    });
  }

  /**
   * Get error statistics for debugging
   * @returns {Object} Error statistics
   */
  getErrorStatistics() {
    const errorCounts = this.errorHistory.reduce((counts, error) => {
      counts[error.type] = (counts[error.type] || 0) + 1;
      return counts;
    }, {});
    
    return {
      totalErrors: this.errorHistory.length,
      errorCounts,
      retryCount: this.retryCount,
      performanceMetrics: this.performanceMetrics,
      recentErrors: this.errorHistory.slice(-5) // Last 5 errors
    };
  }
}

/**
 * NetworkMonitor - Monitors network conditions for error handling
 */
class NetworkMonitor {
  constructor() {
    this.connectionInfo = this.getConnectionInfo();
    this.setupNetworkListeners();
  }

  /**
   * Get current connection information
   * @returns {Object} Connection information
   */
  getConnectionInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    return {
      isOnline: navigator.onLine,
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || null,
      rtt: connection?.rtt || null,
      saveData: connection?.saveData || false
    };
  }

  /**
   * Check current network status
   * @returns {Promise<Object>} Network status
   */
  async checkNetworkStatus() {
    const connectionInfo = this.getConnectionInfo();
    
    return {
      isOnline: connectionInfo.isOnline,
      isSlowConnection: this.isSlowConnection(connectionInfo),
      isSaveDataEnabled: connectionInfo.saveData,
      effectiveType: connectionInfo.effectiveType,
      estimatedBandwidth: connectionInfo.downlink,
      roundTripTime: connectionInfo.rtt
    };
  }

  /**
   * Determine if connection is slow
   * @param {Object} connectionInfo - Connection information
   * @returns {boolean}
   */
  isSlowConnection(connectionInfo) {
    const { effectiveType, downlink } = connectionInfo;
    
    // Check effective type
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return true;
    }
    
    // Check bandwidth
    if (downlink && downlink < 1.5) {
      return true;
    }
    
    return false;
  }

  /**
   * Setup network event listeners
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.connectionInfo = this.getConnectionInfo();
    });
    
    window.addEventListener('offline', () => {
      this.connectionInfo = this.getConnectionInfo();
    });
    
    // Listen for connection changes
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', () => {
        this.connectionInfo = this.getConnectionInfo();
      });
    }
  }
}

/**
 * PerformanceMonitor - Monitors video performance for error handling
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      loadTimes: [],
      stallEvents: [],
      memoryUsage: []
    };
    this.isMonitoring = false;
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    this.isMonitoring = true;
    this.monitorMemoryUsage();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;
  }

  /**
   * Record successful load metrics
   * @param {Object} metrics - Load metrics
   */
  recordLoadSuccess(metrics) {
    this.metrics.loadTimes.push({
      ...metrics,
      timestamp: Date.now()
    });
    
    // Keep only recent metrics (last 10)
    if (this.metrics.loadTimes.length > 10) {
      this.metrics.loadTimes = this.metrics.loadTimes.slice(-10);
    }
  }

  /**
   * Record stall event
   * @param {Object} stallInfo - Stall information
   */
  recordStallEvent(stallInfo) {
    this.metrics.stallEvents.push({
      ...stallInfo,
      timestamp: Date.now()
    });
    
    // Keep only recent stall events (last 20)
    if (this.metrics.stallEvents.length > 20) {
      this.metrics.stallEvents = this.metrics.stallEvents.slice(-20);
    }
  }

  /**
   * Check if memory pressure is high
   * @returns {boolean}
   */
  isMemoryPressureHigh() {
    // Check Chrome's memory API
    if ('memory' in performance) {
      const memory = performance.memory;
      const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      return usageRatio > 0.8; // 80% memory usage threshold
    }
    
    // Check device memory API
    if ('deviceMemory' in navigator) {
      return navigator.deviceMemory < 2; // Less than 2GB RAM
    }
    
    return false;
  }

  /**
   * Monitor memory usage periodically
   */
  monitorMemoryUsage() {
    if (!this.isMonitoring) return;
    
    if ('memory' in performance) {
      const memory = performance.memory;
      this.metrics.memoryUsage.push({
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        timestamp: Date.now()
      });
      
      // Keep only recent memory snapshots (last 20)
      if (this.metrics.memoryUsage.length > 20) {
        this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-20);
      }
    }
    
    // Check again in 5 seconds
    setTimeout(() => this.monitorMemoryUsage(), 5000);
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance statistics
   */
  getPerformanceStatistics() {
    const recentLoadTimes = this.metrics.loadTimes.slice(-5);
    const averageLoadTime = recentLoadTimes.length > 0 ?
      recentLoadTimes.reduce((sum, metric) => sum + metric.loadTime, 0) / recentLoadTimes.length :
      0;
    
    return {
      averageLoadTime,
      recentLoadTimes,
      stallEventCount: this.metrics.stallEvents.length,
      recentStallEvents: this.metrics.stallEvents.slice(-5),
      memoryPressure: this.isMemoryPressureHigh(),
      recentMemoryUsage: this.metrics.memoryUsage.slice(-5)
    };
  }
}

export default VideoErrorHandler;