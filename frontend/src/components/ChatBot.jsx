import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, ChevronDown } from 'lucide-react';

const botResponses = {
  default: "I'm not sure about that. You can ask me about orders, products, shipping, or contact support.",
  hello: "Hello! 👋 How can I help you today?",
  support: "You can reach our support team at support@example.com or call us at +91 9876543210 during business hours.",
  shipping: "We offer free shipping on orders above ₹500. Standard delivery takes 3-5 business days. Express delivery (₹100) takes 1-2 business days.",
  orders: "You can track your order in the Orders section after logging in. For order issues, please contact support.",
  payment: "We accept all major credit/debit cards, UPI (GPay, PhonePe, Paytm), and Cash on Delivery.",
  products: "We offer a wide range of grocery products. Browse categories on our homepage or use the search bar to find specific items.",
  contact: "Email: support@example.com\nPhone: +91 9876543210\nAddress: Lawspet, Puducherry",
  refund: "Our refund policy allows returns within 7 days. Contact support with your order ID for refund requests.",
};

function findBestResponse(message) {
  const msg = message.toLowerCase();
  if (msg.includes('hi') || msg.includes('hello')) return botResponses.hello;
  if (msg.includes('support') || msg.includes('help')) return botResponses.support;
  if (msg.includes('shipping') || msg.includes('delivery')) return botResponses.shipping;
  if (msg.includes('order') || msg.includes('track')) return botResponses.orders;
  if (msg.includes('pay') || msg.includes('upi')) return botResponses.payment;
  if (msg.includes('product') || msg.includes('item')) return botResponses.products;
  if (msg.includes('contact') || msg.includes('reach')) return botResponses.contact;
  if (msg.includes('refund') || msg.includes('return')) return botResponses.refund;
  return botResponses.default;
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: "Hi! 👋 How can I help you today? You can ask about:\n• Orders & Tracking\n• Products & Stock\n• Shipping & Delivery\n• Payment Methods\n• Returns & Refunds" }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { type: 'user', text: input }]);

    // Simulate bot typing
    setTimeout(() => {
      const response = findBestResponse(input);
      setMessages(prev => [...prev, { type: 'bot', text: response }]);
    }, 500);

    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-all duration-200 z-50"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-200 ${isMinimized ? 'h-14' : 'h-[500px]'}`}>
      <div className="bg-white rounded-lg shadow-2xl flex flex-col h-full w-[350px] border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-green-500 text-white rounded-t-lg">
          <h3 className="font-semibold">Chat Support</h3>
          <div className="flex gap-2">
            <button onClick={() => setIsMinimized(!isMinimized)} className="hover:text-green-100">
              <ChevronDown className={`transform transition-transform ${isMinimized ? '' : 'rotate-180'}`} />
            </button>
            <button onClick={() => setIsOpen(false)} className="hover:text-green-100">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.type === 'user'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatBot;