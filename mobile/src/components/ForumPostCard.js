import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { formatRelativeTime, truncateText } from '../utils/helpers';
import { tokens } from '../theme/tokens';

export default function ForumPostCard({ post, onPress }) {
    const { colors } = useThemeStore();

    const dynamicStyles = {
        card: {
            borderRadius: tokens.radius.lg,
            padding: tokens.spacing[4],
            marginBottom: tokens.spacing[3],
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            ...tokens.shadows.sm,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: tokens.spacing[2.5],
        },
        avatar: {
            width: 32,
            height: 32,
            borderRadius: tokens.radius.full,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: tokens.spacing[2.5],
            backgroundColor: colors.primary,
        },
        avatarText: {
            color: '#fff',
            fontWeight: tokens.fontWeight.bold,
            fontSize: tokens.fontSize.base,
        },
        headerInfo: {
            flex: 1,
        },
        authorName: {
            fontSize: tokens.fontSize.sm,
            fontWeight: tokens.fontWeight.semibold,
            color: colors.text,
        },
        date: {
            fontSize: tokens.fontSize.xs,
            marginTop: tokens.spacing[0.5],
            color: colors.textSecondary,
        },
        title: {
            fontSize: tokens.fontSize.base,
            fontWeight: tokens.fontWeight.bold,
            marginBottom: tokens.spacing[1.5],
            lineHeight: tokens.lineHeight.tight * tokens.fontSize.base,
            color: colors.text,
        },
        content: {
            fontSize: tokens.fontSize.sm,
            lineHeight: tokens.lineHeight.normal * tokens.fontSize.sm,
            marginBottom: tokens.spacing[3],
            color: colors.textSecondary,
        },
        footer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: tokens.spacing[4],
        },
        stat: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: tokens.spacing[1],
        },
        statText: {
            fontSize: tokens.fontSize.xs,
            color: colors.textSecondary,
        },
        badge: {
            marginLeft: 'auto',
            paddingHorizontal: tokens.spacing[2],
            paddingVertical: tokens.spacing[0.5] + tokens.spacing[1],
            borderRadius: tokens.radius.md,
            backgroundColor: colors.primary + '20',
        },
        badgeText: {
            fontSize: tokens.fontSize.xs - 1,
            fontWeight: tokens.fontWeight.semibold,
            color: colors.primary,
        },
    };

    return (
        <TouchableOpacity 
            style={dynamicStyles.card} 
            onPress={onPress} 
            activeOpacity={0.9}
        >
            <View style={dynamicStyles.header}>
                <View style={dynamicStyles.avatar}>
                    <Text style={dynamicStyles.avatarText}>
                        {(post.author?.name || 'U').charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View style={dynamicStyles.headerInfo}>
                    <Text style={dynamicStyles.authorName}>
                        {post.author?.name || 'Anonymous'}
                    </Text>
                    <Text style={dynamicStyles.date}>
                        {formatRelativeTime(post.createdAt)}
                    </Text>
                </View>
            </View>
            <Text style={dynamicStyles.title} numberOfLines={2}>
                {post.title}
            </Text>
            <Text style={dynamicStyles.content} numberOfLines={3}>
                {truncateText(post.content, 150)}
            </Text>
            <View style={dynamicStyles.footer}>
                <View style={dynamicStyles.stat}>
                    <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} />
                    <Text style={dynamicStyles.statText}>{post.replyCount || 0}</Text>
                </View>
                <View style={dynamicStyles.stat}>
                    <Ionicons name="heart-outline" size={14} color={colors.textSecondary} />
                    <Text style={dynamicStyles.statText}>{post.likes?.length || 0}</Text>
                </View>
                {post.category && (
                    <View style={dynamicStyles.badge}>
                        <Text style={dynamicStyles.badgeText}>{post.category}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}
