import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
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

function NewThread() {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('general');
    const [files, setFiles] = useState([]);

    const createMutation = useMutation({
        mutationFn: async (formData) => {
            const response = await api.post('/forum', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        },
        onSuccess: (data) => {
            navigate(`/forum/${data._id}`);
        },
        onError: (error) => {
            alert(error.response?.data?.message || 'Failed to create thread');
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('category', category);
        files.forEach(file => {
            formData.append('attachments', file);
        });

        createMutation.mutate(formData);
    };

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files);
        setFiles(prev => [...prev, ...newFiles].slice(0, 5));
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    if (!user) {
        navigate('/login');
        return null;
    }

    return (
        <Layout>
            <div className="forum-page new-thread-page container py-8 max-w-3xl">
                <div className="page-header flex items-center gap-4 mb-8">
                    <button className="btn-back p-2 hover:bg-muted rounded-full" onClick={() => navigate('/forum')}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold">Start a New Discussion</h1>
                </div>

                <form className="new-thread-form bg-card p-8 border rounded-xl shadow-sm space-y-6" onSubmit={handleSubmit}>
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
                                className="w-full p-3 border rounded-md pr-16"
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
                                className="w-full p-3 border rounded-md resize-y min-h-[200px]"
                            />
                            <span className="char-count absolute right-3 bottom-3 text-xs text-muted-foreground">{content.length}/10000</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="block text-sm font-medium mb-2">Attachments (Optional)</label>
                        <div className="file-upload-area">
                            <label className="upload-zone border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/5 transition-colors">
                                <Paperclip size={24} className="mb-2 text-muted-foreground" />
                                <span className="text-sm font-medium">Click to upload files</span>
                                <small className="text-xs text-muted-foreground mt-1">Images, PDFs, Documents (max 5 files, 5MB each)</small>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                    hidden
                                />
                            </label>

                            {files.length > 0 && (
                                <div className="uploaded-files mt-4 space-y-2">
                                    {files.map((file, index) => (
                                        <div key={index} className="file-item flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                                            <span className="truncate max-w-[80%]">{file.name}</span>
                                            <button type="button" onClick={() => removeFile(index)} className="p-1 hover:text-destructive">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-actions flex gap-4 pt-4 border-t">
                        <button type="button" className="btn-cancel flex-1 py-3 border rounded-md hover:bg-muted" onClick={() => navigate('/forum')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit flex-1 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center justify-center gap-2" disabled={createMutation.isPending}>
                            <Send size={18} />
                            {createMutation.isPending ? 'Creating...' : 'Create Thread'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}

export default NewThread;
