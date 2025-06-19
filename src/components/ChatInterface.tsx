import React, { useState, useEffect } from 'react';
import { Menu, Mic, Settings, X, Send } from 'lucide-react';
import { useRealtimeConversation } from '../hooks/useRealtimeConversation';

interface ChatInterfaceProps {
  className?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ className = '' }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [botModuleOpen, setBotModuleOpen] = useState(false);
  const [currentBot, setCurrentBot] = useState('Listening');
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const {
    isConnected,
    isListening,
    isSpeaking,
    transcript,
    error,
    connect,
    startListening,
    stopListening,
    sendTextMessage,
    userActivated,
    hasMicrophonePermission,
  } = useRealtimeConversation();

  const botModules = ['Listening', 'Reading', 'Speaking', 'Writing'];
  const menuItems = ['Sign In', 'Progress'];

  // Handle transcript updates
  useEffect(() => {
    if (transcript && isListening) {
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        
        if (lastMessage && lastMessage.role === 'user') {
          lastMessage.content = transcript;
        } else {
          newMessages.push({ role: 'user', content: transcript });
        }
        
        return newMessages;
      });
    }
  }, [transcript, isListening]);

  const handleVoiceToggle = async () => {
    if (!isConnected) {
      // Only connect when user clicks the button for the first time
      try {
        await connect();
        // Don't automatically start listening - let user click again if they want
      } catch (err) {
        console.error('Failed to connect:', err);
      }
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !isConnected) return;
    
    setMessages(prev => [...prev, { role: 'user', content: inputValue }]);
    sendTextMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Only show active states if user has activated the conversation
  const isVoiceActive = userActivated && (isListening || isSpeaking);

  const VoiceStatusIcon = ({ isActive }: { isActive: boolean }) => (
    <div className="flex items-center gap-1">
      <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
        isActive ? 'bg-green-400' : 'bg-white/50'
      }`} />
      <div className={`w-1 h-1 rounded-full transition-colors duration-200 ${
        isActive ? 'bg-green-400' : 'bg-white/30'
      }`} />
      <div className={`w-1 h-1 rounded-full transition-colors duration-200 ${
        isActive ? 'bg-green-400' : 'bg-white/30'
      }`} />
    </div>
  );

  return (
    <div className={`min-h-[100dvh] h-[100dvh] bg-black text-white flex flex-col ${className}`}>
      {/* Drawer Overlay */}
      {drawerOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-3/4 sm:w-80 bg-black border-r border-white/20 transform transition-transform duration-300 ${
        drawerOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Menu</h2>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item}
                className="block w-full text-left text-white/80 hover:text-white py-3 px-4 rounded-lg hover:bg-white/10 transition-colors duration-200"
                onClick={() => setDrawerOpen(false)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black border-b border-white/10">
        {/* Left - Hamburger Menu */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Center - Bot Name */}
        <h1 className="text-lg font-semibold text-white">{currentBot}</h1>

        {/* Right - Voice Status */}
        <div className="flex items-center">
          <VoiceStatusIcon isActive={isVoiceActive} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-black overflow-hidden">
        {error && (
          <div className="p-4 bg-red-500/20 border-b border-red-500/30">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4 px-4">
              <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-white/10 rounded-full" />
              </div>
              <p className="text-white/60 text-sm">
                {hasMicrophonePermission 
                  ? 'Click the voice button to start a conversation'
                  : 'Click the voice button to grant microphone permission and start'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-white/20 text-white'
                      : 'bg-white/10 text-white/90'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            {isListening && (
              <div className="flex justify-end">
                <div className="max-w-[80%] px-4 py-2 rounded-lg bg-white/20 text-white">
                  <p className="text-sm italic">Listening...</p>
                </div>
              </div>
            )}
            {isSpeaking && (
              <div className="flex justify-start">
                <div className="max-w-[80%] px-4 py-2 rounded-lg bg-white/10 text-white/90">
                  <p className="text-sm italic">Speaking...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settings Popover */}
      {botModuleOpen && (
        <>
          <div 
            className="fixed inset-0 z-30"
            onClick={() => setBotModuleOpen(false)}
          />
          <div className="absolute bottom-20 left-4 z-40 w-48 bg-black/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg p-2 animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="space-y-1">
              {botModules.map((module) => (
                <button
                  key={module}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 ${
                    currentBot === module 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => {
                    setCurrentBot(module);
                    setBotModuleOpen(false);
                  }}
                >
                  {module}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Bottom Chat Bar */}
      <div className="p-4 bg-black">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-3">
          <div className="flex items-center gap-3">
            {/* Left - Settings/Bot Module Selector */}
            <button
              onClick={() => setBotModuleOpen(!botModuleOpen)}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors duration-200 shrink-0"
            >
              <Settings className="h-5 w-5" />
            </button>

            {/* Center - Input Field */}
            <div className="flex-1">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything"
                className="w-full bg-transparent text-white placeholder:text-white/50 focus:outline-none py-2 px-2"
                disabled={!isConnected}
              />
            </div>

            {/* Right - Send, Microphone and Voice Assistant */}
            <div className="flex items-center gap-2 shrink-0">
              {inputValue.trim() && (
                <button
                  onClick={handleSendMessage}
                  disabled={!isConnected}
                  className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </button>
              )}
              
              <button 
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
                disabled={!isConnected}
              >
                <Mic className="h-5 w-5" />
              </button>
              
              <button
                className={`p-3 rounded-full transition-all duration-200 ${
                  isVoiceActive
                    ? 'bg-white text-black hover:bg-white/90' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                onClick={handleVoiceToggle}
                disabled={false}
              >
                <div className="w-2 h-2 rounded-full bg-current" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;