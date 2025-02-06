import React, { useState, useRef, useEffect } from 'react';
import { useModel } from '../contexts/ModelContext';
import { ModelLoadingIndicator } from './ModelLoadingIndicator';
import { MessageHydrator } from '../services/MessageHydrator';
import { useThreadContext } from '../contexts/ThreadContext';
import { MessageList } from './MessageList';

export const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('');
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

  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [currentThread?.messages]);

  useEffect(() => {
    const handleWorkerMessage = (event: CustomEvent<string>) => {
      if (hydratorRef.current) {
        hydratorRef.current.appendToken(event.detail);
      }
    };

    const handleStreamFinished = () => {
      if (!hydratorRef.current) return;

      if (newMessageRef.current) {
        newMessageRef.current.remove();
      }

      addMessage(activeThread?.id!, {
        role: "assistant",
        content: hydratorRef.current!.getAndClearBuffer()
      });

      if (newMessageRef.current) {
        newMessageRef.current.innerHTML = '';
      }

      hydratorRef.current = null;
    }

    window.addEventListener('onToken', handleWorkerMessage as any);
    window.addEventListener("done", handleStreamFinished as any);
    return () => {
      window.removeEventListener('onToken', handleWorkerMessage as any);
      window.removeEventListener("done", handleStreamFinished as any);
    }
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
    createNewThread();
    setIsSidebarOpen(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    hydratorRef.current = new MessageHydrator(newMessageRef.current!);

    await processMessage();
  };

  const processMessage = async () => {
    setInput('');
    setModelError(null);

    if (!activeThread) {
      createThread("New Chat", [{
        id: crypto.randomUUID(),
        role: "user",
        content: input
      }]);
    } else {
      addMessage(activeThread.id, {
        role: "user",
        content: input
      });
    }

    try {
      await generateStreamingResponse(input);
    } catch (error) {
      console.error('Error generating response:', error);
      setModelError('Failed to generate response. Please try again.');
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
          <div ref={newMessageRef}></div>
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-2 sm:p-4 bg-white">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={!isLoading ? "Type your message..." : "Initializing model..."}
              className="flex-1 rounded-lg border p-2 focus:outline-none focus:border-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {isLoading ? 'Generating...' : 'Send'}
            </button>
          </form>
        </div>
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