import { useWindowDimensions } from 'react-native';

export const useResponsive = () => {
    const { width, height } = useWindowDimensions();
    
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;
    
    const isLandscape = width > height;
    const isPortrait = height >= width;
    
    const screenWidth = width;
    const screenHeight = height;
    
    const isWeb = typeof window !== 'undefined' && window.navigator?.userAgent?.includes('ReactNative');
    const isSSR = typeof window === 'undefined';
    
    const getColumnCount = (options = {}) => {
        const { mobile = 2, tablet = 3, desktop = 4 } = options;
        if (isDesktop) return desktop;
        if (isTablet) return tablet;
        return mobile;
    };
    
    const getSpacing = (options = {}) => {
        const { mobile = 16, tablet = 24, desktop = 32 } = options;
        if (isDesktop) return desktop;
        if (isTablet) return tablet;
        return mobile;
    };
    
    const getFontSize = (options = {}) => {
        const { mobile = 14, tablet = 16, desktop = 18 } = options;
        if (isDesktop) return desktop;
        if (isTablet) return tablet;
        return mobile;
    };
    
    return {
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
        isLandscape,
        isPortrait,
        screenWidth,
        screenHeight,
        isWeb: !isSSR,
        isSSR,
        getColumnCount,
        getSpacing,
        getFontSize,
    };
};

export default useResponsive;