import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useNetwork } from "../context/NetworkContext";
import { useOfflineSync } from "../hooks/useOfflineSync";

export function NetworkStatus(props) {
  const { style, showPendingCount = true, onRetry } = props;
  const network = useNetwork();
  const { getTimeSinceLastOnline, manualSync, preloadOfflineData } = useOfflineSync();
  
  const [isVisible, setIsVisible] = useState(false);
  const [opacity] = useState(new Animated.Value(0));

  const isConnected = network.isConnected;
  const isInternetReachable = network.isInternetReachable;
  const pendingCount = network.pendingCount;
  const isOffline = !isConnected || !isInternetReachable;

  useEffect(function() {
    if (isOffline) {
      setIsVisible(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(function() { setIsVisible(false); });
    }
  }, [isOffline, opacity]);

  useEffect(function() {
    if (!isOffline) {
      preloadOfflineData();
    }
  }, [isOffline, preloadOfflineData]);

  function handleRetry() {
    manualSync().then(function(success) {
      if (onRetry) {
        onRetry(success);
      }
    });
  }

  if (!isVisible) return null;

  return React.createElement(Animated.View, { style: [styles.container, { opacity: opacity }, style] },
    isOffline ?
      React.createElement(View, { style: styles.offlineContainer },
        React.createElement(Text, { style: styles.icon }, "📡"),
        React.createElement(View, { style: styles.textContainer },
          React.createElement(Text, { style: styles.title }, "You are offline"),
          pendingCount > 0 && showPendingCount &&
            React.createElement(Text, { style: styles.subtitle },
              pendingCount + " action" + (pendingCount > 1 ? "s" : "") + " pending sync"
            )
        ),
        React.createElement(TouchableOpacity, { style: styles.retryButton, onPress: handleRetry },
          React.createElement(Text, { style: styles.retryText }, "Retry")
        )
      )
      :
      React.createElement(View, { style: styles.onlineContainer },
        React.createElement(Text, { style: styles.icon }, "✅"),
        React.createElement(Text, { style: styles.onlineText }, "Back online!")
      )
  );
}

export function NetworkStatusBanner(props) {
  const { style } = props;
  const network = useNetwork();
  const pendingCount = network.pendingCount;
  
  const isConnected = network.isConnected;
  const isInternetReachable = network.isInternetReachable;
  const isOffline = !isConnected || !isInternetReachable;

  if (!isOffline && pendingCount === 0) return null;

  return React.createElement(View, { style: [styles.banner, style] },
    isOffline ?
      React.createElement(React.Fragment, null,
        React.createElement(Text, { style: styles.bannerIcon }, "📡"),
        React.createElement(Text, { style: styles.bannerText }, "Offline Mode"),
        pendingCount > 0 && React.createElement(Text, { style: styles.bannerBadge }, pendingCount)
      )
      :
      React.createElement(React.Fragment, null,
        React.createElement(Text, { style: styles.bannerIcon }, "🔄"),
        React.createElement(Text, { style: styles.bannerText }, "Syncing..."),
        React.createElement(Text, { style: styles.bannerBadge }, pendingCount)
      )
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: 12,
  },
  offlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    padding: 12,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  onlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    padding: 12,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    marginTop: 2,
  },
  retryButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6B6B",
  },
  onlineText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: "center",
  },
  bannerIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  bannerText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  bannerBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF6B6B",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
    overflow: "hidden",
  },
});

export default NetworkStatus;
