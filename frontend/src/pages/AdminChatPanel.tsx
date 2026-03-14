// короч надо потом доделать эту хрень она тип панель админка куда будут с тех чата ответы приходить (наверное хз пока надо ли это)

// import React, { useState } from "react"; 
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { MessageCircle, User } from "lucide-react";

// interface Chat {
//   id: string;
//   userId: string;
//   userName: string;
//   lastMessage: string;
//   unread: number;
// }

// const AdminChatPanel: React.FC = () => {
//   const [activeChats, setActiveChats] = useState<Chat[]>([
//     { id: "1", userId: "user1", userName: "Иван Петров", lastMessage: "Как добавить новый узел?", unread: 2 },
//     { id: "2", userId: "user2", userName: "Алексей Смирнов", lastMessage: "Проблема с подключением", unread: 0 },
//   ]);

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           <MessageCircle className="h-5 w-5" />
//           Активные чаты поддержки
//         </CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="space-y-3">
//           {activeChats.map(chat => (
//             <div key={chat.id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
//               <div className="bg-gray-200 rounded-full p-2 mr-3">
//                 <User className="h-5 w-5 text-gray-600" />
//               </div>
//               <div className="flex-1">
//                 <div className="font-medium">{chat.userName}</div>
//                 <div className="text-sm text-gray-600 truncate">{chat.lastMessage}</div>
//               </div>
//               {chat.unread > 0 && (
//                 <div className="bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
//                   {chat.unread}
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       </CardContent>
//     </Card>
//   );
// };

// export default AdminChatPanel; 