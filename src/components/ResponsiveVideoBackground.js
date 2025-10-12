import React, { useState, useEffect, useRef, useCallback } from 'react';
import VideoSourceManager from '../utils/VideoSourceManager';
import './ResponsiveVideoBackground.css';

/**
 * ResponsiveVideoBackground - A video background component that adapts to device capabilities
 * and provides smooth loading states with fallback support
 */
const ResponsiveVideoBackground = ({
  fallbackImage = null,
  onLoadStart = () => {},
  onLoadComplete = () => {},
  onError = () => {},
  className = '',
  enableDebugLogging = false
}) => {
  const [loadingState, setLoadingState] = useState('initial'); // 'initial', 'loading', 'loaded', 'error'
  const [videoSources, setVideoSources] = useState([]);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [showFallback, setShowFallback] = useState(true);
  
  const videoRef = useRef(null);
  const sourceManagerRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const loadStartTimeRef = useRef(null);

  // Initialize VideoSourceManager
  useEffect(() => {
    const initializeVideoManager = async () => {
      sourceManagerRef.current = new VideoSourceManager();
      
      // Initialize battery monitoring for mobile optimizations
      await sourceManagerRef.current.initializeBatteryMonitoring();
      
      const sources = sourceManagerRef.current.getOptimalVideoSources();
      setVideoSources(sources);
      
      if (enableDebugLogging) {
        sourceManagerRef.current.logDebugInfo();
      }
    };
    
    initializeVideoManager();
  }, [enableDebugLogging]);

  // Handle window resize and orientation changes
  useEffect(() => {
    const handleResize = () => {
      if (sourceManagerRef.current) {
        sourceManagerRef.current.updateCapabilities();
        const newSources = sourceManagerRef.current.getOptimalVideoSources();
        
        // Only update sources if they've actually changed
        if (JSON.stringify(newSources) !== JSON.stringify(videoSources)) {
          setVideoSources(newSources);
          setCurrentSourceIndex(0);
          
          if (enableDebugLogging) {
            console.log('Video sources updated due to capability change:', newSources);
          }
        }
      }
    };

    const debouncedResize = debounce(handleResize, 300);
    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', debouncedResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', debouncedResize);
    };
  }, [videoSources, enableDebugLogging]);

  // Handle video loading start
  const handleLoadStart = useCallback(() => {
    setLoadingState('loading');
    loadStartTimeRef.current = Date.now();
    onLoadStart();
    
    if (enableDebugLogging) {
      console.log('Video loading started');
    }
  }, [onLoadStart, enableDebugLogging]);

  // Handle successful video load
  const handleCanPlay = useCallback(() => {
    setLoadingState('loaded');
    setShowFallback(false);
    
    const loadTime = Date.now() - (loadStartTimeRef.current || Date.now());
    onLoadComplete({ loadTime, source: videoSources[currentSourceIndex] });
    
    if (enableDebugLogging) {
      console.log(`Video loaded successfully in ${loadTime}ms:`, videoSources[currentSourceIndex]);
    }
  }, [onLoadComplete, videoSources, currentSourceIndex, enableDebugLogging]);

  // Handle video loading errors with fallback logic
  const handleError = useCallback((event) => {
    const currentSource = videoSources[currentSourceIndex];
    
    if (enableDebugLogging) {
      console.warn('Video loading error:', event, 'Current source:', currentSource);
    }

    // Try next source if available
    if (currentSourceIndex < videoSources.length - 1) {
      const nextIndex = currentSourceIndex + 1;
      setCurrentSourceIndex(nextIndex);
      
      if (enableDebugLogging) {
        console.log(`Trying fallback source ${nextIndex + 1}/${videoSources.length}:`, videoSources[nextIndex]);
      }
      
      // Small delay before trying next source to prevent rapid failures
      retryTimeoutRef.current = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
        }
      }, 500);
    } else {
      // All sources failed, show fallback
      setLoadingState('error');
      setShowFallback(true);
      onError({ 
        message: 'All video sources failed to load',
        sources: videoSources,
        lastError: event
      });
      
      if (enableDebugLogging) {
        console.error('All video sources failed to load');
      }
    }
  }, [videoSources, currentSourceIndex, onError, enableDebugLogging]);

  // Handle video metadata loaded (for smooth transitions)
  const handleLoadedMetadata = useCallback(() => {
    if (enableDebugLogging) {
      console.log('Video metadata loaded');
    }
  }, [enableDebugLogging]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Get preload strategy from VideoSourceManager
  const getPreloadStrategy = () => {
    return sourceManagerRef.current?.getPreloadStrategy() || 'metadata';
  };

  // Get mobile-optimized video attributes
  const getVideoAttributes = () => {
    if (sourceManagerRef.current) {
      // Use the enhanced mobile optimization attributes
      const mobileAttributes = sourceManagerRef.current.getMobileOptimizedVideoAttributes();
      const baseAttributes = {
        autoPlay: true,
        loop: true,
        muted: true,
        playsInline: true,
        preload: getPreloadStrategy()
      };
      
      // Merge base attributes with mobile optimizations
      return { ...baseAttributes, ...mobileAttributes };
    }
    
    // Fallback attributes
    return {
      autoPlay: true,
      loop: true,
      muted: true,
      playsInline: true,
      preload: getPreloadStrategy()
    };
  };

  // Render video sources
  const renderVideoSources = () => {
    if (!videoSources.length) return null;

    return videoSources.map((source, index) => (
      <source
        key={`${source.src}-${index}`}
        src={source.src}
        type={source.type}
        data-quality={source.quality}
        data-resolution={source.resolution}
      />
    ));
  };

  // Get mobile optimization CSS classes
  const getMobileOptimizationClasses = () => {
    if (sourceManagerRef.current) {
      return sourceManagerRef.current.getMobileOptimizationClasses();
    }
    return [];
  };

  return (
    <div className={`responsive-video-background ${className}`}>
      {/* Fallback background pattern */}
      <div 
        className={`video-fallback ${showFallback ? 'visible' : 'hidden'} ${getMobileOptimizationClasses().join(' ')}`}
        style={fallbackImage ? { backgroundImage: `url(${fallbackImage})` } : {}}
      />
      
      {/* Loading indicator */}
      {loadingState === 'loading' && (
        <div className="video-loading-indicator">
          <div className="loading-spinner" />
        </div>
      )}
      
      {/* Video element */}
      {videoSources.length > 0 && (
        <video
          ref={videoRef}
          className={`background-video ${loadingState === 'loaded' ? 'loaded' : ''} ${getMobileOptimizationClasses().join(' ')}`}
          onLoadStart={handleLoadStart}
          onCanPlay={handleCanPlay}
          onError={handleError}
          onLoadedMetadata={handleLoadedMetadata}
          {...getVideoAttributes()}
        >
          {renderVideoSources()}
          Your browser does not support the video tag.
        </video>
      )}
      
      {/* Debug information */}
      {enableDebugLogging && process.env.NODE_ENV === 'development' && (
        <div className="video-debug-info">
          <div>State: {loadingState}</div>
          <div>Source: {currentSourceIndex + 1}/{videoSources.length}</div>
          <div>Device: {sourceManagerRef.current?.deviceCapabilities?.deviceType}</div>
          <div>Quality: {videoSources[currentSourceIndex]?.quality}</div>
          <div>Battery: {sourceManagerRef.current?.deviceCapabilities?.batteryStatus?.level ? 
            `${Math.round(sourceManagerRef.current.deviceCapabilities.batteryStatus.level * 100)}%` : 'N/A'}</div>
          <div>Thermal: {sourceManagerRef.current?.deviceCapabilities?.thermalState?.state || 'N/A'}</div>
          <div>Low-end: {sourceManagerRef.current?.deviceCapabilities?.isLowEndDevice ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};

// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default ResponsiveVideoBackground;