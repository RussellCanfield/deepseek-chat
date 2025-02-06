import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export interface Thread {
    id: string;
    title: string;
    messages: Message[];
}

interface ThreadContextType {
    threads: Thread[];
    activeThread: Thread | null;
    setActiveThread: (thread: Thread | null) => void;
    createThread: (title: string, messages?: Message[]) => Thread;
    addMessage: (threadId: string, message: Omit<Message, 'id' | 'timestamp'>) => Message | null;
    updateMessage: (threadId: string, messageId: string, content: string) => void;
    deleteThread: (threadId: string) => void;
    clearThreadMessages: (threadId: string) => void;
    updateThreadTitle: (threadId: string, title: string) => void;
}

const ThreadContext = createContext<ThreadContextType | null>(null);

const STORAGE_KEY = 'chatThreads';
const ACTIVE_THREAD_KEY = 'activeThread';

export const ThreadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [threads, setThreads] = useState<Thread[]>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    });

    const [activeThread, setActiveThread] = useState<Thread | null>(() => {
        const stored = localStorage.getItem(ACTIVE_THREAD_KEY);
        return stored ? JSON.parse(stored) : null;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    }, [threads]);

    useEffect(() => {
        localStorage.setItem(ACTIVE_THREAD_KEY, JSON.stringify(activeThread));
    }, [activeThread]);

    const createThread = (title: string, messages: Message[] = []) => {
        const newThread: Thread = {
            id: crypto.randomUUID(),
            messages,
            title,
        };

        setThreads(prev => [newThread, ...prev]);
        setActiveThread(newThread);
        return newThread;
    };

    const addMessage = (threadId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
        const threadIndex = threads.findIndex(t => t.id === threadId);
        if (threadIndex === -1) return null;

        const newMessage: Message = {
            ...message,
            id: crypto.randomUUID(),
        };

        setThreads(prev => {
            const updated = [...prev];
            updated[threadIndex] = {
                ...updated[threadIndex],
                messages: [...updated[threadIndex].messages, newMessage],
            };
            return updated;
        });

        // Update activeThread if this message belongs to it
        if (activeThread?.id === threadId) {
            setActiveThread(prev => prev ? {
                ...prev,
                messages: [...prev.messages, newMessage],
            } : null);
        }

        return newMessage;
    };

    const updateMessage = (threadId: string, messageId: string, content: string) => {
        setThreads(prev => {
            const threadIndex = prev.findIndex(t => t.id === threadId);
            if (threadIndex === -1) return prev;

            const updated = [...prev];
            const messageIndex = updated[threadIndex].messages.findIndex(m => m.id === messageId);
            if (messageIndex === -1) return prev;

            updated[threadIndex] = {
                ...updated[threadIndex],
                messages: updated[threadIndex].messages.map(m =>
                    m.id === messageId ? { ...m, content, isStreaming: false } : m
                ),
            };

            return updated;
        });
    };

    const deleteThread = (threadId: string) => {
        setThreads(prev => prev.filter(t => t.id !== threadId));
        if (activeThread?.id === threadId) {
            setActiveThread(threads[0] || null);
        }
    };

    const clearThreadMessages = (threadId: string) => {
        setThreads(prev => {
            const threadIndex = prev.findIndex(t => t.id === threadId);
            if (threadIndex === -1) return prev;

            const updated = [...prev];
            updated[threadIndex] = {
                ...updated[threadIndex],
                messages: [],
            };
            return updated;
        });
    };

    const updateThreadTitle = (threadId: string, title: string) => {
        setThreads(prev => {
            const threadIndex = prev.findIndex(t => t.id === threadId);
            if (threadIndex === -1) return prev;

            const updated = [...prev];
            updated[threadIndex] = {
                ...updated[threadIndex],
                title,
            };
            return updated;
        });
    };

    return (
        <ThreadContext.Provider value={{
            threads,
            activeThread,
            setActiveThread,
            createThread,
            addMessage,
            updateMessage,
            deleteThread,
            clearThreadMessages,
            updateThreadTitle,
        }
        }>
            {children}
        </ThreadContext.Provider>
    );
};

export const useThreadContext = () => {
    const context = useContext(ThreadContext);
    if (!context) {
        throw new Error('useThreadContext must be used within a ThreadProvider');
    }
    return context;
};