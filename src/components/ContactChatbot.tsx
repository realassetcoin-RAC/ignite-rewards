import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  X, 
  Minimize2,
  Maximize2,
  Paperclip,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { 
  createConversation, 
  addInteraction, 
  getIssueCategories, 
  getIssueTags,
  createTicket,
  uploadAttachment
} from "@/lib/contactSystem";
import { sendSlackMessage } from "@/lib/slackIntegration";

interface ChatMessage {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface ChatbotState {
  isOpen: boolean;
  isMinimized: boolean;
  currentStep: 'greeting' | 'query' | 'category' | 'tag' | 'description' | 'attachments' | 'confirmation' | 'completed';
  conversationId?: string;
  sessionId: string;
  userQuery?: string;
  selectedCategory?: string;
  selectedTag?: string;
  description?: string;
  attachments: File[];
  ticketId?: string;
}

const ContactChatbot = () => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [state, setState] = useState<ChatbotState>({
    isOpen: false,
    isMinimized: false,
    currentStep: 'greeting',
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    attachments: []
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCategories = async () => {
    try {
      const result = await getIssueCategories();
      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTags = async (categoryId: string) => {
    try {
      const result = await getIssueTags(categoryId);
      if (result.success) {
        setTags(result.data || []);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const addMessage = (type: 'user' | 'bot' | 'system', content: string, metadata?: any) => {
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date(),
      metadata
    };
    setMessages(prev => [...prev, message]);
    return message;
  };

  const logInteraction = async (type: string, content: string, metadata?: any) => {
    if (state.conversationId) {
      try {
        await addInteraction(state.conversationId, type, content, metadata);
      } catch (error) {
        console.error('Error logging interaction:', error);
      }
    }
  };

  const startConversation = async () => {
    try {
      const result = await createConversation(state.sessionId, user?.id, user?.email);
      if (result.success) {
        setState(prev => ({ ...prev, conversationId: result.conversationId }));
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleOpenChat = async () => {
    setState(prev => ({ ...prev, isOpen: true, isMinimized: false }));
    
    if (state.currentStep === 'greeting') {
      await startConversation();
      
      // Add greeting message
      addMessage('bot', "Hello! I'm your AI assistant. I'm here to help you with any questions or issues you might have. How can I assist you today?");
      
      // Log the greeting
      await logInteraction('bot_response', "Hello! I'm your AI assistant. I'm here to help you with any questions or issues you might have. How can I assist you today?");
    }
  };

  const handleCloseChat = () => {
    setState(prev => ({ ...prev, isOpen: false }));
  };

  const handleMinimizeChat = () => {
    setState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user message
    addMessage('user', userMessage);
    await logInteraction('user_message', userMessage);

    // Process based on current step
    await processUserInput(userMessage);
  };

  const processUserInput = async (userInput: string) => {
    switch (state.currentStep) {
      case 'greeting':
        await handleInitialQuery(userInput);
        break;
      case 'query':
        await handleQueryResponse(userInput);
        break;
      case 'category':
        await handleCategorySelection(userInput);
        break;
      case 'tag':
        await handleTagSelection(userInput);
        break;
      case 'description':
        await handleDescriptionInput(userInput);
        break;
      case 'attachments':
        await handleAttachmentStep(userInput);
        break;
      case 'confirmation':
        await handleConfirmation(userInput);
        break;
    }
  };

  const handleInitialQuery = async (query: string) => {
    setState(prev => ({ ...prev, userQuery: query, currentStep: 'query' }));
    
    // AI analysis of the query (simulated)
    const response = await analyzeQuery(query);
    
    if (response.canResolve) {
      addMessage('bot', response.message);
      await logInteraction('bot_response', response.message, { canResolve: true });
      
      // Ask if they need further assistance
      setTimeout(() => {
        addMessage('bot', "Is there anything else I can help you with? If you need to report an issue or ask a specific question, just let me know!");
        logInteraction('bot_response', "Is there anything else I can help you with? If you need to report an issue or ask a specific question, just let me know!");
      }, 1000);
    } else {
      addMessage('bot', response.message);
      await logInteraction('bot_response', response.message, { canResolve: false });
      
      // Present option to report issue
      setTimeout(() => {
        addMessage('bot', "Would you like to report an issue or ask a question? I can help you create a support ticket.");
        logInteraction('bot_response', "Would you like to report an issue or ask a question? I can help you create a support ticket.");
      }, 1000);
    }
  };

  const handleQueryResponse = async (response: string) => {
    if (response.toLowerCase().includes('report') || response.toLowerCase().includes('issue') || response.toLowerCase().includes('ticket')) {
      setState(prev => ({ ...prev, currentStep: 'category' }));
      
      addMessage('bot', "Great! I'll help you create a support ticket. First, please select the category that best describes your issue:");
      await logInteraction('bot_response', "Great! I'll help you create a support ticket. First, please select the category that best describes your issue:");
      
      // Show category options
      setTimeout(() => {
        const categoryOptions = categories.map(cat => 
          `• **${cat.category_name}** - ${cat.description}`
        ).join('\n');
        
        addMessage('bot', `Please choose one of these categories:\n\n${categoryOptions}\n\nJust type the category name or number.`);
        logInteraction('bot_response', `Please choose one of these categories:\n\n${categoryOptions}\n\nJust type the category name or number.`);
      }, 1000);
    } else {
      // Continue with general assistance
      const aiResponse = await generateAIResponse(response);
      addMessage('bot', aiResponse);
      await logInteraction('bot_response', aiResponse);
    }
  };

  const handleCategorySelection = async (selection: string) => {
    const selectedCategory = categories.find(cat => 
      cat.category_name.toLowerCase().includes(selection.toLowerCase()) ||
      cat.category_key.toLowerCase().includes(selection.toLowerCase())
    );

    if (selectedCategory) {
      setState(prev => ({ ...prev, selectedCategory: selectedCategory.category_key, currentStep: 'tag' }));
      
      addMessage('bot', `Perfect! You've selected "${selectedCategory.category_name}". Now let me get the specific tags for this category...`);
      await logInteraction('bot_response', `Perfect! You've selected "${selectedCategory.category_name}". Now let me get the specific tags for this category...`);
      
      await loadTags(selectedCategory.id);
      
      setTimeout(() => {
        const tagOptions = tags.map(tag => 
          `• **${tag.tag_name}** - ${tag.description}`
        ).join('\n');
        
        addMessage('bot', `Please select a more specific tag:\n\n${tagOptions}\n\nType the tag name or number.`);
        logInteraction('bot_response', `Please select a more specific tag:\n\n${tagOptions}\n\nType the tag name or number.`);
      }, 1000);
    } else {
      addMessage('bot', "I didn't recognize that category. Please select one of the available categories from the list above.");
      await logInteraction('bot_response', "I didn't recognize that category. Please select one of the available categories from the list above.");
    }
  };

  const handleTagSelection = async (selection: string) => {
    const selectedTag = tags.find(tag => 
      tag.tag_name.toLowerCase().includes(selection.toLowerCase()) ||
      tag.tag_key.toLowerCase().includes(selection.toLowerCase())
    );

    if (selectedTag) {
      setState(prev => ({ ...prev, selectedTag: selectedTag.tag_key, currentStep: 'description' }));
      
      addMessage('bot', `Excellent! You've selected "${selectedTag.tag_name}". Now please provide a detailed description of your issue. The more details you provide, the better we can help you.`);
      await logInteraction('bot_response', `Excellent! You've selected "${selectedTag.tag_name}". Now please provide a detailed description of your issue. The more details you provide, the better we can help you.`);
    } else {
      addMessage('bot', "I didn't recognize that tag. Please select one of the available tags from the list above.");
      await logInteraction('bot_response', "I didn't recognize that tag. Please select one of the available tags from the list above.");
    }
  };

  const handleDescriptionInput = async (description: string) => {
    setState(prev => ({ ...prev, description, currentStep: 'attachments' }));
    
    addMessage('bot', "Thank you for the detailed description. If you have any supporting files (screenshots, videos, documents) that might help us understand your issue better, you can attach them now. You can attach up to 3 files, each with a maximum size of 5MB.");
    await logInteraction('bot_response', "Thank you for the detailed description. If you have any supporting files (screenshots, videos, documents) that might help us understand your issue better, you can attach them now. You can attach up to 3 files, each with a maximum size of 5MB.");
    
    setTimeout(() => {
      addMessage('bot', "Click the paperclip icon to attach files, or type 'skip' to proceed without attachments.");
      logInteraction('bot_response', "Click the paperclip icon to attach files, or type 'skip' to proceed without attachments.");
    }, 1000);
  };

  const handleAttachmentStep = async (input: string) => {
    if (input.toLowerCase() === 'skip' || input.toLowerCase() === 'no attachments') {
      setState(prev => ({ ...prev, currentStep: 'confirmation' }));
      await showConfirmation();
    } else {
      addMessage('bot', "Please use the paperclip icon to attach files, or type 'skip' to proceed without attachments.");
      await logInteraction('bot_response', "Please use the paperclip icon to attach files, or type 'skip' to proceed without attachments.");
    }
  };

  const showConfirmation = async () => {
    const category = categories.find(cat => cat.category_key === state.selectedCategory);
    const tag = tags.find(tag => tag.tag_key === state.selectedTag);
    
    addMessage('bot', `Perfect! Let me confirm your ticket details:\n\n**Category:** ${category?.category_name}\n**Tag:** ${tag?.tag_name}\n**Description:** ${state.description}\n**Attachments:** ${state.attachments.length} file(s)\n\nType 'confirm' to submit your ticket, or 'edit' to make changes.`);
    await logInteraction('bot_response', `Perfect! Let me confirm your ticket details:\n\n**Category:** ${category?.category_name}\n**Tag:** ${tag?.tag_name}\n**Description:** ${state.description}\n**Attachments:** ${state.attachments.length} file(s)\n\nType 'confirm' to submit your ticket, or 'edit' to make changes.`);
  };

  const handleConfirmation = async (input: string) => {
    if (input.toLowerCase() === 'confirm') {
      await submitTicket();
    } else if (input.toLowerCase() === 'edit') {
      setState(prev => ({ ...prev, currentStep: 'category' }));
      addMessage('bot', "No problem! Let's start over. Please select the category that best describes your issue:");
      await logInteraction('bot_response', "No problem! Let's start over. Please select the category that best describes your issue:");
    } else {
      addMessage('bot', "Please type 'confirm' to submit your ticket, or 'edit' to make changes.");
      await logInteraction('bot_response', "Please type 'confirm' to submit your ticket, or 'edit' to make changes.");
    }
  };

  const submitTicket = async () => {
    try {
      setIsLoading(true);
      
      // Create ticket
      const ticketResult = await createTicket({
        userEmail: user?.email || 'anonymous@example.com',
        userName: user?.user_metadata?.full_name || 'Anonymous User',
        category: state.selectedCategory!,
        tag: state.selectedTag!,
        description: state.description!,
        attachments: state.attachments
      });

      if (ticketResult.success) {
        setState(prev => ({ ...prev, ticketId: ticketResult.ticketId, currentStep: 'completed' }));
        
        addMessage('bot', `🎉 **Your ticket has been submitted successfully!**\n\n**Ticket ID:** ${ticketResult.ticketId}\n\nOur support team will review your request and get back to you as soon as possible. You can reference this ticket ID in any future communications.`);
        await logInteraction('bot_response', `🎉 **Your ticket has been submitted successfully!**\n\n**Ticket ID:** ${ticketResult.ticketId}\n\nOur support team will review your request and get back to you as soon as possible. You can reference this ticket ID in any future communications.`);
        
        toast({
          title: "Ticket Submitted",
          description: `Your support ticket ${ticketResult.ticketId} has been created successfully.`,
        });
      } else {
        throw new Error(ticketResult.error || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Error submitting ticket:', error);
      addMessage('bot', "I'm sorry, there was an error submitting your ticket. Please try again or contact us directly via email.");
      await logInteraction('bot_response', "I'm sorry, there was an error submitting your ticket. Please try again or contact us directly via email.");
      
      toast({
        title: "Error",
        description: "Failed to submit ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    
    // Validate files
    for (const file of fileArray) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File Too Large",
          description: `${file.name} is larger than 5MB. Please choose a smaller file.`,
          variant: "destructive",
        });
        return;
      }
    }

    if (state.attachments.length + fileArray.length > 3) {
      toast({
        title: "Too Many Files",
        description: "You can only attach up to 3 files total.",
        variant: "destructive",
      });
      return;
    }

    setState(prev => ({ 
      ...prev, 
      attachments: [...prev.attachments, ...fileArray]
    }));

    addMessage('bot', `Great! I've added ${fileArray.length} file(s) to your ticket. You can attach more files or type 'skip' to proceed.`);
    await logInteraction('bot_response', `Great! I've added ${fileArray.length} file(s) to your ticket. You can attach more files or type 'skip' to proceed.`);
  };

  const removeAttachment = (index: number) => {
    setState(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  // AI simulation functions
  const analyzeQuery = async (query: string): Promise<{ canResolve: boolean; message: string }> => {
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const commonQuestions = [
      'how to', 'what is', 'where is', 'when does', 'can i', 'is it possible'
    ];
    
    const hasCommonQuestion = commonQuestions.some(phrase => 
      query.toLowerCase().includes(phrase)
    );
    
    if (hasCommonQuestion) {
      return {
        canResolve: true,
        message: "Based on your question, I can help you with that! Let me provide you with some guidance..."
      };
    }
    
    return {
      canResolve: false,
      message: "I understand you're looking for help. While I can provide general guidance, it sounds like you might need more specific assistance."
    };
  };

  const generateAIResponse = async (query: string): Promise<string> => {
    // Simulate AI response generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return "I'd be happy to help you with that! Let me provide you with some information that might be useful...";
  };

  if (!state.isOpen) {
    return (
      <Button 
        onClick={handleOpenChat}
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Start Chat
      </Button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${state.isMinimized ? 'w-80' : 'w-96'} transition-all duration-300`}>
      <Card className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Assistant</h3>
              <p className="text-xs text-gray-500">Online • 24/7 Support</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMinimizeChat}
              className="h-8 w-8 p-0"
            >
              {state.isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseChat}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!state.isMinimized && (
          <>
            {/* Chat Messages */}
            <CardContent className="p-4 h-80 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.type === 'bot' && (
                          <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        )}
                        {message.type === 'user' && (
                          <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </CardContent>

            {/* Attachments Display */}
            {state.attachments.length > 0 && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  {state.attachments.map((file, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />
                      {file.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        className="h-4 w-4 p-0 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 w-8 p-0"
                  disabled={state.attachments.length >= 3}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default ContactChatbot;
