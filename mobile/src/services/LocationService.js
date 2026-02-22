import * as Location from 'expo-location';
import { useDriverStore } from '../store/driverStore';
import { haversineDistanceKm } from '../utils/helpers';

class LocationService {
    static async requestPermissions() {
        try {
            const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
            if (foregroundStatus !== 'granted') {
                return { granted: false, error: 'Location permission denied' };
            }
            
            const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
            return { 
                granted: true, 
                backgroundGranted: backgroundStatus === 'granted' 
            };
        } catch (error) {
            console.error('Permission request error:', error);
            return { granted: false, error: error.message };
        }
    }

    static async getCurrentLocation() {
        try {
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status !== 'granted') {
                const result = await this.requestPermissions();
                if (!result.granted) {
                    return null;
                }
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
                timestamp: location.timestamp,
            };
        } catch (error) {
            console.error('Failed to get current location:', error);
            return null;
        }
    }

    static async startTracking(callback, options = {}) {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
            const result = await this.requestPermissions();
            if (!result.granted) {
                return null;
            }
        }

        const config = {
            accuracy: options.accuracy || Location.Accuracy.BestForNavigation,
            timeInterval: options.timeInterval || 15000,
            distanceInterval: options.distanceInterval || 50,
        };

        try {
            const watcher = await Location.watchPositionAsync(config, (location) => {
                const locationData = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    accuracy: location.coords.accuracy,
                    timestamp: location.timestamp,
                };
                if (callback) {
                    callback(locationData);
                }
            });

            return watcher;
        } catch (error) {
            console.error('Failed to start location tracking:', error);
            return null;
        }
    }

    static stopTracking(watcher) {
        if (watcher) {
            watcher.remove();
        }
    }

    static calculateDistance(lat1, lon1, lat2, lon2) {
        return haversineDistanceKm({ lat: lat1, lng: lon1 }, { lat: lat2, lng: lon2 });
    }

    static formatDistance(km) {
        if (km < 1) {
            return `${Math.round(km * 1000)} m`;
        }
        return `${km.toFixed(1)} km`;
    }

    static formatDuration(minutes) {
        if (minutes < 60) {
            return `${Math.round(minutes)} min`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}m`;
    }
}

export default LocationService;
