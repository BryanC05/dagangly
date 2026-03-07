import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Modal,
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useLanguageStore } from '../../store/languageStore';
import api from '../../api';

const categories = [
    { id: 'all', icon: 'folder-outline', labelKey: 'allProjects' },
    { id: 'website', icon: 'globe-outline', labelKey: 'websites' },
    { id: 'game', icon: 'game-controller-outline', labelKey: 'games' },
    { id: 'app', icon: 'phone-portrait-outline', labelKey: 'apps' },
    { id: 'other', icon: 'folder-outline', labelKey: 'other' },
];

export default function ProjectsScreen({ navigation }) {
    const { colors } = useThemeStore();
    const { t, language } = useLanguageStore();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProject, setNewProject] = useState({
        name: '',
        description: '',
        link: '',
        category: 'website',
        tags: '',
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, [selectedCategory, searchQuery]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedCategory !== 'all') {
                params.append('category', selectedCategory);
            }
            if (searchQuery) {
                params.append('search', searchQuery);
            }
            
            const response = await api.get(`/projects?${params.toString()}`);
            setProjects(response.data || []);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async () => {
        if (!newProject.name.trim() || !newProject.link.trim()) {
            Alert.alert(t.error || 'Error', 'Name and Link are required');
            return;
        }

        try {
            setCreating(true);
            const projectData = {
                ...newProject,
                tags: newProject.tags.split(',').map(tag => tag.trim()).filter(Boolean),
            };
            
            await api.post('/projects', projectData);
            setShowCreateModal(false);
            setNewProject({
                name: '',
                description: '',
                link: '',
                category: 'website',
                tags: '',
            });
            fetchProjects();
            Alert.alert(t.success || 'Success', 'Project created successfully!');
        } catch (error) {
            console.error('Failed to create project:', error);
            Alert.alert(t.error || 'Error', 'Failed to create project');
        } finally {
            setCreating(false);
        }
    };

    const openProjectLink = async (url) => {
        try {
            await Linking.openURL(url);
        } catch (error) {
            Alert.alert(t.error || 'Error', 'Failed to open link');
        }
    };

    const getCategoryIcon = (category) => {
        const cat = categories.find(c => c.id === category);
        return cat ? cat.icon : 'folder-outline';
    };

    const getCategoryLabel = (labelKey) => {
        return t(labelKey) || labelKey;
    };

    const renderProject = ({ item }) => (
        <TouchableOpacity
            style={[styles.projectCard, { backgroundColor: colors.card }]}
            onPress={() => openProjectLink(item.link)}
        >
            <View style={[styles.categoryIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name={getCategoryIcon(item.category)} size={24} color={colors.primary} />
            </View>
            <View style={styles.projectInfo}>
                <Text style={[styles.projectName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                </Text>
                {item.description && (
                    <Text style={[styles.projectDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}
                {item.tags && item.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {item.tags.slice(0, 3).map((tag, index) => (
                            <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                                <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
            <Ionicons name="open-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t.projects}</Text>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder={t.searchProducts || 'Search...'}
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Category Filter */}
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesContainer}
                contentContainerStyle={styles.categoriesContent}
            >
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category.id}
                        style={[
                            styles.categoryChip,
                            { 
                                backgroundColor: selectedCategory === category.id 
                                    ? colors.primary 
                                    : colors.card 
                            }
                        ]}
                        onPress={() => setSelectedCategory(category.id)}
                    >
                        <Ionicons 
                            name={category.icon} 
                            size={16} 
                            color={selectedCategory === category.id ? '#fff' : colors.text} 
                        />
                        <Text 
                            style={[
                                styles.categoryChipText,
                                { color: selectedCategory === category.id ? '#fff' : colors.text }
                            ]}
                        >
                            {getCategoryLabel(category.labelKey)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Projects List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : projects.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="folder-open-outline" size={64} color={colors.textSecondary} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        {t.noProductsFound || 'No projects found'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={projects}
                    renderItem={renderProject}
                    keyExtractor={(item) => item._id || item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* FAB for Create */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => setShowCreateModal(true)}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>

            {/* Create Project Modal */}
            <Modal
                visible={showCreateModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{t.createProject}</Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.inputLabel, { color: colors.text }]}>{t.projectName} *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={newProject.name}
                                onChangeText={(text) => setNewProject({ ...newProject, name: text })}
                                placeholder={t.projectName}
                                placeholderTextColor={colors.textSecondary}
                            />

                            <Text style={[styles.inputLabel, { color: colors.text }]}>{t.projectDescription}</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={newProject.description}
                                onChangeText={(text) => setNewProject({ ...newProject, description: text })}
                                placeholder={t.projectDescription}
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                numberOfLines={3}
                            />

                            <Text style={[styles.inputLabel, { color: colors.text }]}>{t.projectLink} *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={newProject.link}
                                onChangeText={(text) => setNewProject({ ...newProject, link: text })}
                                placeholder="https://..."
                                placeholderTextColor={colors.textSecondary}
                                autoCapitalize="none"
                                keyboardType="url"
                            />

                            <Text style={[styles.inputLabel, { color: colors.text }]}>{t.projectCategory}</Text>
                            <View style={styles.categoryPicker}>
                                {categories.slice(1).map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.categoryOption,
                                            { 
                                                backgroundColor: newProject.category === cat.id 
                                                    ? colors.primary 
                                                    : colors.background,
                                                borderColor: colors.border
                                            }
                                        ]}
                                        onPress={() => setNewProject({ ...newProject, category: cat.id })}
                                    >
                                        <Ionicons 
                                            name={cat.icon} 
                                            size={16} 
                                            color={newProject.category === cat.id ? '#fff' : colors.text} 
                                        />
                                        <Text 
                                            style={[
                                                styles.categoryOptionText,
                                                { color: newProject.category === cat.id ? '#fff' : colors.text }
                                            ]}
                                        >
                                            {getCategoryLabel(cat.labelKey)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.inputLabel, { color: colors.text }]}>{t.projectTags}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={newProject.tags}
                                onChangeText={(text) => setNewProject({ ...newProject, tags: text })}
                                placeholder="tag1, tag2, tag3"
                                placeholderTextColor={colors.textSecondary}
                            />

                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                                onPress={handleCreateProject}
                                disabled={creating}
                            >
                                {creating ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>{t.createProject}</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    categoriesContainer: {
        maxHeight: 44,
        marginBottom: 12,
    },
    categoriesContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        gap: 4,
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: '500',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
    },
    projectCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    categoryIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    projectInfo: {
        flex: 1,
        marginLeft: 12,
    },
    projectName: {
        fontSize: 16,
        fontWeight: '600',
    },
    projectDescription: {
        fontSize: 13,
        marginTop: 4,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        gap: 4,
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '500',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    categoryPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        gap: 4,
    },
    categoryOptionText: {
        fontSize: 13,
    },
    submitButton: {
        marginTop: 24,
        marginBottom: 40,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
