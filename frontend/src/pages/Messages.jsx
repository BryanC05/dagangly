import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search, Phone, Video, MoreVertical, Check, CheckCheck } from "lucide-react";
import { useState } from "react";

// Mock data
const conversations = [
    {
        id: "1",
        user: { name: "Maria's Crafts", isOnline: true, isSeller: true },
        lastMessage: "Yes, the bamboo basket is still available!",
        timestamp: "2 min ago",
        unread: 2,
    },
    {
        id: "2",
        user: { name: "Farm Fresh PH", isOnline: true, isSeller: true },
        lastMessage: "I can offer free shipping for orders above ₱500",
        timestamp: "1 hour ago",
        unread: 0,
    },
    {
        id: "3",
        user: { name: "Juan Santos", isOnline: false },
        lastMessage: "Thanks for the purchase! Please leave a review 😊",
        timestamp: "Yesterday",
        unread: 0,
    },
    {
        id: "4",
        user: { name: "Shell Arts", isOnline: false, isSeller: true },
        lastMessage: "The capiz lamp will be shipped tomorrow",
        timestamp: "2 days ago",
        unread: 0,
    },
];

const mockMessages = [
    {
        id: "1",
        content: "Hi! I'm interested in the bamboo basket. Is it still available?",
        timestamp: "10:30 AM",
        isMine: true,
        status: "read",
    },
    {
        id: "2",
        content: "Hello! Yes, the bamboo basket is still available! 🎋",
        timestamp: "10:32 AM",
        isMine: false,
    },
    {
        id: "3",
        content: "Great! Can you tell me more about the dimensions?",
        timestamp: "10:33 AM",
        isMine: true,
        status: "read",
    },
    {
        id: "4",
        content: "Sure! It's about 30cm in diameter and 25cm tall. Perfect for storing fruits, bread, or as a decorative piece.",
        timestamp: "10:35 AM",
        isMine: false,
    },
    {
        id: "5",
        content: "That sounds perfect. Do you offer delivery to Makati?",
        timestamp: "10:36 AM",
        isMine: true,
        status: "read",
    },
    {
        id: "6",
        content: "Yes, we deliver to Makati! Shipping fee is ₱80 for Metro Manila. Usually takes 2-3 days.",
        timestamp: "10:38 AM",
        isMine: false,
    },
    {
        id: "7",
        content: "I'll take it! How do I proceed with the order?",
        timestamp: "10:40 AM",
        isMine: true,
        status: "delivered",
    },
];

const Messages = () => {
    const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
    const [messageInput, setMessageInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredConversations = conversations.filter((conv) =>
        conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSendMessage = () => {
        if (messageInput.trim()) {
            // In a real app, this would send the message to the backend
            console.log("Sending message:", messageInput);
            setMessageInput("");
        }
    };

    return (
        <>
            <div className="container py-4 md:py-8">
                <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-lg border bg-card">
                    {/* Conversations List */}
                    <div className={`w-full md:w-80 border-r flex flex-col ${selectedConversation ? "hidden md:flex" : "flex"}`}>
                        <div className="p-4 border-b">
                            <h2 className="font-semibold text-lg mb-4">Messages</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search conversations..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-2">
                                {filteredConversations.map((conv) => (
                                    <button
                                        key={conv.id}
                                        onClick={() => setSelectedConversation(conv)}
                                        className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${selectedConversation?.id === conv.id
                                                ? "bg-primary/10"
                                                : "hover:bg-muted"
                                            }`}
                                    >
                                        <div className="relative">
                                            <Avatar>
                                                <AvatarImage src={conv.user.avatar} />
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    {conv.user.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            {conv.user.isOnline && (
                                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-accent rounded-full border-2 border-card" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-medium truncate flex items-center gap-1">
                                                    {conv.user.name}
                                                    {/* Account status badges removed */}
                                                </span>
                                                <span className="text-xs text-muted-foreground shrink-0">
                                                    {conv.timestamp}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2 mt-1">
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {conv.lastMessage}
                                                </p>
                                                {conv.unread > 0 && (
                                                    <Badge className="shrink-0">{conv.unread}</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Chat Area */}
                    {selectedConversation ? (
                        <div className="flex-1 flex flex-col">
                            {/* Chat Header */}
                            <div className="p-4 border-b flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden"
                                        onClick={() => setSelectedConversation(null)}
                                    >
                                        ←
                                    </Button>
                                    <Avatar>
                                        <AvatarImage src={selectedConversation.user.avatar} />
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {selectedConversation.user.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold flex items-center gap-2">
                                            {selectedConversation.user.name}
                                            {/* Account status badges removed */}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {selectedConversation.user.isOnline ? (
                                                <span className="text-accent">● Online</span>
                                            ) : (
                                                "Offline"
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon">
                                        <Phone className="h-5 w-5" />
                                    </Button>
                                    <Button variant="ghost" size="icon">
                                        <Video className="h-5 w-5" />
                                    </Button>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Messages */}
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-4">
                                    {mockMessages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.isMine ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`max-w-[70%] rounded-2xl px-4 py-2 ${message.isMine
                                                        ? "bg-primary text-primary-foreground rounded-br-md"
                                                        : "bg-muted rounded-bl-md"
                                                    }`}
                                            >
                                                <p className="text-sm">{message.content}</p>
                                                <div
                                                    className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${message.isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                                                        }`}
                                                >
                                                    <span>{message.timestamp}</span>
                                                    {message.isMine && message.status && (
                                                        <>
                                                            {message.status === "read" ? (
                                                                <CheckCheck className="h-3 w-3" />
                                                            ) : (
                                                                <Check className="h-3 w-3" />
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>

                            {/* Message Input */}
                            <div className="p-4 border-t">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <Input
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1"
                                    />
                                    <Button type="submit" size="icon">
                                        <Send className="h-5 w-5" />
                                    </Button>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 hidden md:flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                                <MessageIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                <p>Select a conversation to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

// Simple message icon component
const MessageIcon = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

export default Messages;
