import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    Animated,
    Dimensions,
    StyleSheet,
} from 'react-native';
import { useThemeStore } from '../store/themeStore';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Simple ParticleBurst component
function ParticleBurst({ x, y, icons, count, onDone }) {
    const animations = useRef(
        Array.from({ length: count }, () => ({
            translateX: new Animated.Value(0),
            translateY: new Animated.Value(0),
            opacity: new Animated.Value(1),
            scale: new Animated.Value(0),
        }))
    ).current;

    useEffect(() => {
        const duration = 800;
        const angleStep = (2 * Math.PI) / count;
        
        const anims = animations.map((anim, i) => {
            const angle = angleStep * i + Math.random() * 0.5;
            const distance = 80 + Math.random() * 60;
            const targetX = Math.cos(angle) * distance;
            const targetY = Math.sin(angle) * distance;

            return Animated.parallel([
                Animated.timing(anim.translateX, { toValue: targetX, duration, useNativeDriver: true }),
                Animated.timing(anim.translateY, { toValue: targetY, duration, useNativeDriver: true }),
                Animated.sequence([
                    Animated.timing(anim.scale, { toValue: 1, duration: duration * 0.3, useNativeDriver: true }),
                    Animated.timing(anim.scale, { toValue: 0, duration: duration * 0.7, useNativeDriver: true }),
                ]),
                Animated.timing(anim.opacity, { toValue: 0, duration, useNativeDriver: true }),
            ]);
        });

        Animated.parallel(anims).start(() => onDone?.());
    }, []);

    return (
        <View style={[StyleSheet.absoluteFill, { left: x, top: y }]}>
            {animations.map((anim, i) => (
                <Animated.Text
                    key={i}
                    style={[
                        {
                            position: 'absolute',
                            fontSize: 20,
                        },
                        {
                            transform: [
                                { translateX: anim.translateX },
                                { translateY: anim.translateY },
                                { scale: anim.scale },
                            ],
                            opacity: anim.opacity,
                        },
                    ]}
                >
                    {icons[i % icons.length]}
                </Animated.Text>
            ))}
        </View>
    );
}

// ─── Global Event Bus ────────────────────────────────────────────────────────
// A lightweight pub/sub that replaces window.dispatchEvent for React Native.
// Usage from any screen:
//   import { particleEvents } from '../components/BackgroundEffect';
//   particleEvents.emit('particle-burst', { type: 'add-to-cart', x, y });
class EventBus {
    constructor() { this._listeners = {}; }
    on(event, cb) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(cb);
        return () => this.off(event, cb);
    }
    off(event, cb) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(l => l !== cb);
    }
    emit(event, data) {
        (this._listeners[event] || []).forEach(cb => cb(data));
    }
}
export const particleEvents = new EventBus();

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BackgroundEffect() {
    const { colors } = useThemeStore();
    const [bursts, setBursts] = useState([]);

    useEffect(() => {
        const BURST_CONFIGS = {
            'add-to-cart': { icons: ['🛒', '🍜', '⭐', '✨', '🛍️'], count: 16 },
            'save': { icons: ['❤️', '💖', '💕', '✨', '💝'], count: 14 },
            'checkout': { icons: ['🎉', '🛒', '🛍️', '✨', '🥳'], count: 24 },
        };

        const unsub = particleEvents.on('particle-burst', ({ type, x, y }) => {
            const config = BURST_CONFIGS[type];
            if (!config || !x || !y) return;
            const id = Date.now() + Math.random();
            setBursts(prev => [...prev, { id, x, y, ...config }]);
        });

        return unsub;
    }, []);

    const removeBurst = useCallback((id) => {
        setBursts(prev => prev.filter(b => b.id !== id));
    }, []);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Particle bursts */}
            {bursts.map(burst => (
                <ParticleBurst
                    key={burst.id}
                    x={burst.x}
                    y={burst.y}
                    icons={burst.icons}
                    count={burst.count}
                    onDone={() => removeBurst(burst.id)}
                />
            ))}
        </View>
    );
}
