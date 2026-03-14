import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Send } from "lucide-react";

export const ChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{text: string, isUser: boolean}[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (newMessage.trim()) {
      setMessages([...messages, {text: newMessage, isUser: true}]);
      setNewMessage("");
      
      // Имитация ответа поддержки через 1.5 секунды
      setTimeout(() => {
        setMessages(prev => [...prev, {
          text: "Спасибо за вопрос! Мы ответим в ближайшее время.", 
          isUser: false
        }]);
      }, 1500);
    }
  };

  return (
    <>
      {/* Кнопка чата в углу экрана */}
      {!isOpen && (
        <Button
          variant="default"
          size="lg"
          className="fixed bottom-6 right-6 rounded-full shadow-lg z-40"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="h-5 w-5 mr-2" />
          Поддержка
        </Button>
      )}

      {/* Окно чата */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 z-50">
          <Card className="shadow-xl">
            <CardHeader className="p-4 bg-gray-50 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MessageCircle className="h-4 w-4" />
                  Чат с поддержкой
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-64 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 h-full flex items-center justify-center">
                    Напишите ваш вопрос
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs p-3 rounded-lg ${msg.isUser ? "bg-blue-500 text-white" : "bg-gray-100"}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t p-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ваше сообщение..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={handleSend}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};