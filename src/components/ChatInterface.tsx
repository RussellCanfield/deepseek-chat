import React, { useRef, useEffect, useState } from 'react';
import { useModel } from '../contexts/ModelContext';
import { ModelLoadingIndicator } from './ModelLoadingIndicator';
import { MessageHydrator } from '../services/MessageHydrator';
import { useThreadContext } from '../contexts/ThreadContext';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

export const ChatInterface: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const newMessageRef = useRef<HTMLDivElement>(null);
  const hydratorRef = useRef<MessageHydrator | null>(null);

  const {
    threads,
    activeThread,
    setActiveThread,
    createThread,
    addMessage
  } = useThreadContext();

  const { initializeModel, generateStreamingResponse, loadingProgress, isLoading } = useModel();

  useEffect(() => {
    const handleWorkerMessage = (event: CustomEvent<string>) => {
      if (hydratorRef.current) {
        hydratorRef.current.appendToken(event.detail);
      }
    };

    const handleStreamFinished = () => {
      if (!hydratorRef.current) return;

      const finalMessage = hydratorRef.current.getAndClearBuffer();

      if (newMessageRef.current) {
        newMessageRef.current.innerHTML = '';
      }

      addMessage(activeThread?.id!, {
        role: "assistant",
        content: finalMessage
      });

      hydratorRef.current = null;
    };

    const tokenHandler = handleWorkerMessage as EventListener;
    const streamHandler = handleStreamFinished as EventListener;

    window.addEventListener('onToken', tokenHandler);
    window.addEventListener("done", streamHandler);

    return () => {
      window.removeEventListener('onToken', tokenHandler);
      window.removeEventListener("done", streamHandler);
    };
  }, [activeThread?.id, addMessage]);

  useEffect(() => {
    const initModel = async () => {
      try {
        await initializeModel();
      } catch (error) {
        setModelError('Failed to initialize AI model. Please try again later.');
        console.error('Model initialization error:', error);
      }
    };

    initModel();
  }, []);

  const handleCreateNewThread = () => {
    createThread("New Chat");
    setIsSidebarOpen(false);
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    // Clear any previous errors
    setModelError(null);

    // Reset and initialize new hydrator
    if (hydratorRef.current) {
      hydratorRef.current = null;
    }

    if (newMessageRef.current) {
      newMessageRef.current.innerHTML = '';
    }

    hydratorRef.current = new MessageHydrator(newMessageRef.current!);

    if (!activeThread) {
      createThread("New Chat", [{
        id: crypto.randomUUID(),
        role: "user",
        content: message
      }]);
    } else {
      addMessage(activeThread.id, {
        role: "user",
        content: message
      });
    }

    try {
      await generateStreamingResponse(message);
    } catch (error) {
      console.error('Error generating response:', error);
      setModelError('Failed to generate response. Please try again.');

      // Clean up on error
      if (hydratorRef.current) {
        hydratorRef.current = null;
      }
      if (newMessageRef.current) {
        newMessageRef.current.innerHTML = '';
      }
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 top-[72px] flex bg-gray-100">
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-[84px] sm:top-[100px] left-4 z-50 p-2 bg-gray-800 text-white rounded-lg"
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>

      <div
        className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static w-64 h-full bg-gray-800 transition-transform duration-300 ease-in-out z-40 flex flex-col pt-8 p-4`}
      >
        <div className="flex flex-col h-full">
          <button
            onClick={handleCreateNewThread}
            className="w-full bg-blue-600 text-white rounded-lg p-2 mb-4 hover:bg-blue-700 transition-colors"
          >
            New Chat
          </button>
          <div className="flex-1 overflow-y-auto space-y-2">
            {threads.map(thread => (
              <button
                key={thread.id}
                onClick={() => {
                  setActiveThread(thread)
                }}
                className={`w-full text-left p-2 rounded-lg ${activeThread?.id === thread.id
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-700 text-gray-300'
                  } transition-colors`}
              >
                {thread.title || 'Untitled Chat'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full">
        {isLoading && (
          <ModelLoadingIndicator progress={loadingProgress} />
        )}

        {modelError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {modelError}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4" id="message-list">
          <MessageList messages={activeThread?.messages ?? []}>
          </MessageList>
          <div className='space-y-4' ref={newMessageRef}></div>
          <div ref={messagesEndRef} />
        </div>

        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};