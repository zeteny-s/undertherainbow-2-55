import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { AIMessage, NewsletterComponent } from '../../../types/newsletter-builder-types';
import { supabase } from '../../../integrations/supabase/client';

interface AIChatProps {
  onClose: () => void;
  context: {
    title: string;
    campus: string;
    selectedForms: any[];
  };
}

export const AIChat: React.FC<AIChatProps> = ({ onClose, context }) => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm here to help you create content for your newsletter "${context.title}". I can help you write text blocks, create headings, or suggest content based on your selected forms. What would you like to create?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Create a context-rich prompt for the AI
      const contextPrompt = `
        You are helping create content for a newsletter titled "${context.title}" for the ${context.campus} campus.
        ${context.selectedForms.length > 0 ? `The newsletter will include these forms: ${context.selectedForms.map(f => f.title).join(', ')}` : ''}
        
        User request: ${input}
        
        Please provide helpful content suggestions or generate content that could be used in the newsletter. 
        If the user wants to create a specific component (heading, text block, etc.), provide the content and I'll help them add it to the newsletter.
      `;

      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          messages: [
            { role: 'system', content: 'You are a helpful assistant for creating newsletter content.' },
            { role: 'user', content: contextPrompt }
          ]
        }
      });

      if (error) throw error;

      const aiResponse: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);

      // Check if the AI response suggests creating a component
      const response = data.response.toLowerCase();
      if (response.includes('heading') && response.includes('create')) {
        // Suggest creating a heading component
        setTimeout(() => {
          const headingText = extractTextFromResponse(data.response, 'heading');
          if (headingText) {
            suggestComponent('heading', { text: headingText, level: 2 });
          }
        }, 1000);
      } else if (response.includes('text') && response.includes('paragraph')) {
        // Suggest creating a text block
        setTimeout(() => {
          const textContent = extractTextFromResponse(data.response, 'text');
          if (textContent) {
            suggestComponent('text-block', { content: textContent });
          }
        }, 1000);
      }

    } catch (error) {
      console.error('Error calling AI:', error);
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const extractTextFromResponse = (response: string, type: string): string => {
    // Simple extraction logic - in a real app, this would be more sophisticated
    const lines = response.split('\n').filter(line => line.trim());
    return lines.find(line => line.length > 20) || `Generated ${type} content`;
  };

  const suggestComponent = (type: string, content: any) => {
    const suggestion: AIMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Would you like me to add this ${type} to your newsletter?`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, suggestion]);

    // Add a component suggestion button
    setTimeout(() => {
      const component: NewsletterComponent = {
        id: `component-${Date.now()}`,
        type: type as any,
        content,
        position: 0
      };

      const buttonMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `<button onclick="addSuggestedComponent('${JSON.stringify(component).replace(/"/g, '&quot;')}')">Add to Newsletter</button>`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, buttonMessage]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      <Card className="flex-1 rounded-none border-0 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-lg">AI Content Assistant</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white ml-auto'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-3 w-3 text-white" />
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask for help with newsletter content..."
                className="flex-1"
                disabled={loading}
              />
              <Button onClick={handleSend} disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};