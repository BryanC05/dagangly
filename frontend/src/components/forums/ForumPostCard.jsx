import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageCircle, ThumbsUp, Clock } from "lucide-react";
import { Link } from "react-router-dom";

// Helper to format time ago
const formatTimeAgo = (date) => {
    if (!date) return 'Recently';
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return past.toLocaleDateString();
};

const ForumPostCard = ({ post }) => {
    // Handle API data structure
    const postId = post._id || post.id;
    const authorName = post.author?.name || 'Anonymous';
    const authorAvatar = post.author?.avatar || null;
    const authorBadge = post.author?.badge || null;
    const timeAgo = post.timeAgo || formatTimeAgo(post.createdAt);
    const category = post.category || 'General';
    const excerpt = post.excerpt || post.content?.substring(0, 150) + '...' || '';
    const replies = post.replies?.length || post.replyCount || 0;
    const likes = post.likes || post.likeCount || 0;

    return (
        <Link to={`/forum/${postId}`}>
            <Card className="transition-all hover:shadow-md hover:border-primary/20">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={authorAvatar} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {authorName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{authorName}</span>
                                    {authorBadge && (
                                        <Badge variant="secondary" className="text-xs">
                                            {authorBadge}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {timeAgo}
                                </div>
                            </div>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                            {category}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary">
                        {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            <span>{replies} replies</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{likes} likes</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};

export default ForumPostCard;
