import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Paperclip, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import Layout from '@/components/layout/Layout';
import './Forum.css';

const categories = [
    { id: 'general', label: 'General', icon: '💬' },
    { id: 'products', label: 'Products', icon: '🛍️' },
    { id: 'tips', label: 'Tips & Tricks', icon: '💡' },
    { id: 'help', label: 'Help & Support', icon: '🆘' },
];

function EditThread() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    const { data: thread, isLoading } = useQuery({
        queryKey: ['forumThread', id],
        queryFn: async () => {
            const response = await api.get(`/forum/${id}`);
            return response.data.thread;
        },
    });

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('general');
    const [isInitialized, setIsInitialized] = useState(false);

    if (thread && !isInitialized) {
        setTitle(thread.title || '');
        setContent(thread.content || '');
        setCategory(thread.category || 'general');
        setIsInitialized(true);
    }

    const updateMutation = useMutation({
        mutationFn: async (formData) => {
            const response = await api.put(`/forum/${id}`, formData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['forumThread', id]);
            navigate(`/forum/${id}`);
        },
        onError: (error) => {
            alert(error.response?.data?.message || 'Failed to update thread');
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        updateMutation.mutate({
            title,
            content,
            category,
        });
    };

    if (!user) {
        navigate('/login');
        return null;
    }

    if (isLoading) {
        return (
            <Layout>
                <div className="forum-page container py-8 max-w-3xl">
                    <div className="text-center py-12">Loading thread...</div>
                </div>
            </Layout>
        );
    }

    if (!thread) {
        return (
            <Layout>
                <div className="forum-page container py-8 max-w-3xl">
                    <div className="text-center py-12">
                        <h2 className="text-xl font-bold mb-4">Thread not found</h2>
                        <button className="btn-back" onClick={() => navigate('/forum')}>
                            <ArrowLeft size={20} /> Back to Forum
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    const isAuthor = user?._id === thread?.author?._id || user?.id === thread?.author?._id;

    if (!isAuthor) {
        return (
            <Layout>
                <div className="forum-page container py-8 max-w-3xl">
                    <div className="text-center py-12">
                        <h2 className="text-xl font-bold mb-4">Not Authorized</h2>
                        <p className="text-muted-foreground mb-4">You can only edit your own threads.</p>
                        <button className="btn-back" onClick={() => navigate('/forum')}>
                            <ArrowLeft size={20} /> Back to Forum
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="forum-page new-thread-page container py-8 max-w-3xl">
                <div className="page-header flex items-center gap-4 mb-8">
                    <button className="btn-back p-2 hover:bg-muted rounded-full" onClick={() => navigate(`/forum/${id}`)}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold">Edit Discussion</h1>
                </div>

                <form key={thread?._id} className="new-thread-form bg-card p-8 border rounded-xl shadow-sm space-y-6" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="category" className="block text-sm font-medium mb-3">Category</label>
                        <div className="category-selector grid grid-cols-2 md:grid-cols-4 gap-3">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    className={`category-option flex flex-col items-center gap-2 p-3 border rounded-lg transition-all ${category === cat.id ? 'bg-primary/10 border-primary text-primary ring-1 ring-primary' : 'hover:bg-muted'}`}
                                    onClick={() => setCategory(cat.id)}
                                >
                                    <span className="text-2xl">{cat.icon}</span>
                                    <span className="text-sm">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
                        <div className="relative">
                            <input
                                type="text"
                                id="title"
                                placeholder="What's your discussion about?"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={200}
                                required
                                className="w-full p-3 border rounded-md pr-16 bg-background"
                            />
                            <span className="char-count absolute right-3 top-3 text-xs text-muted-foreground">{title.length}/200</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="content" className="block text-sm font-medium mb-1">Content</label>
                        <div className="relative">
                            <textarea
                                id="content"
                                placeholder="Share your thoughts, questions, or ideas..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={10}
                                maxLength={10000}
                                required
                                className="w-full p-3 border rounded-md resize-y min-h-[200px] bg-background"
                            />
                            <span className="char-count absolute right-3 bottom-3 text-xs text-muted-foreground">{content.length}/10000</span>
                        </div>
                    </div>

                    <div className="form-actions flex gap-4 pt-4 border-t">
                        <button type="button" className="btn-cancel flex-1 py-3 border rounded-md hover:bg-muted" onClick={() => navigate(`/forum/${id}`)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit flex-1 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center justify-center gap-2" disabled={updateMutation.isPending}>
                            <Send size={18} />
                            {updateMutation.isPending ? 'Updating...' : 'Update Thread'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}

export default EditThread;
