import { FC } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChatInterface } from './components/ChatInterface';
import { ModelProvider } from './contexts/ModelContext';
import { ThreadProvider } from './contexts/ThreadContext';

const App: FC = () => {
  return (
    <ModelProvider>
      <ThreadProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow-sm sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
                  AI Chat Assistant
                </h1>
              </div>
            </header>
            <main className="flex-1 flex flex-col relative">
              <div className="w-full h-full flex-1">
                <Routes>
                  <Route
                    path="/"
                    element={<ChatInterface />}
                  />
                </Routes>
              </div>
            </main>
          </div>
        </Router>
      </ThreadProvider>
    </ModelProvider>
  );
};

export default App;