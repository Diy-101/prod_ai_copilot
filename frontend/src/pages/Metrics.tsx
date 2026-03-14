import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Server,
  Database,
  Network,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Генерация случайных данных для статус-карточек
const generateStatusData = () => {
  return {
    servers: {
      total: 24,
      active: 20 + Math.floor(Math.random() * 3) - 1, // 19-21
      warnings: 4 + Math.floor(Math.random() * 3) - 1 // 3-5
    },
    databases: {
      total: 8,
      active: 7,
      critical: Math.random() > 0.7 ? 1 : 0 // 30% chance of critical
    },
    network: {
      total: 156,
      active: 156 - (Math.random() > 0.8 ? 1 : 0) // 20% chance of 1 inactive
    }
  };
};

// Генерация данных для графиков
const generateChartData = () => {
  const data = [];
  const now = new Date();
  
  let serverValue = 85;
  let dbValue = 75;
  let networkValue = 92;
  
  for (let i = 4; i >= 0; i--) {
    const time = new Date(now);
    time.setHours(now.getHours() - i);
    
    serverValue = Math.max(10, Math.min(100, serverValue + (Math.random() * 4 - 2)));
    dbValue = Math.max(10, Math.min(100, dbValue + (Math.random() * 3 - 1.5)));
    networkValue = Math.max(10, Math.min(100, networkValue + (Math.random() * 2 - 1)));
    
    if (Math.random() < 0.1) serverValue = Math.random() * 40;
    if (Math.random() < 0.05) dbValue = Math.random() * 35;
    
    data.push({
      time: `${time.getHours().toString().padStart(2, '0')}:00`,
      servers: Math.round(serverValue),
      databases: Math.round(dbValue),
      network: Math.round(networkValue),
    });
  }
  
  return data;
};

// Генерация случайных алертов
const generateAlerts = (existingAlerts: any[]) => {
  const alerts = [...existingAlerts];
  
  // 30% chance to resolve random alert
  if (alerts.length > 0 && Math.random() < 0.3) {
    const indexToRemove = Math.floor(Math.random() * alerts.length);
    alerts.splice(indexToRemove, 1);
  }
  
  // 20% chance to add new alert
  if (Math.random() < 0.2) {
    const alertTypes = [
      {
        title: "Высокая нагрузка на CPU",
        description: `CPU: ${90 + Math.floor(Math.random() * 10)}%`,
        status: "critical"
      },
      {
        title: "Медленный ответ API",
        description: `Время ответа: ${(2 + Math.random()).toFixed(1)}s`,
        status: "warning"
      },
      {
        title: "Недостаточно памяти",
        description: `Свободно: ${Math.floor(Math.random() * 20)}% RAM`,
        status: "warning"
      }
    ];
    
    const newAlert = {
      ...alertTypes[Math.floor(Math.random() * alertTypes.length)],
      id: Date.now(),
      timestamp: new Date()
    };
    
    alerts.push(newAlert);
  }
  
  return alerts;
};

const Metrics: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [metricsData, setMetricsData] = useState<any[]>([]);
  const [activeAlerts, setActiveAlerts] = useState([
    {
      id: 1,
      title: "Высокая нагрузка на DB-01",
      description: "CPU: 95%, RAM: 87%",
      status: "critical",
      timestamp: new Date(Date.now() - 15 * 60000),
    },
    {
      id: 2,
      title: "Медленный ответ API",
      description: "Время ответа: 2.3s",
      status: "warning",
      timestamp: new Date(Date.now() - 45 * 60000),
    }
  ]);
  const [statusData, setStatusData] = useState({
    servers: { total: 24, active: 20, warnings: 4 },
    databases: { total: 8, active: 7, critical: 1 },
    network: { total: 156, active: 156 }
  });

  // Полное обновление всех данных
  const refreshAllData = () => {
    setMetricsData(generateChartData());
    setStatusData(generateStatusData());
    setActiveAlerts(prev => generateAlerts(prev));
    setLastUpdate(new Date());
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    toast.success("Начинаем обновление метрик...");

    setTimeout(() => {
      toast.success("Получаем данные с серверов мониторинга");
    }, 1000);

    setTimeout(() => {
      refreshAllData();
      setIsLoading(false);
      toast.success("Метрики успешно обновлены");
    }, 2000);
  };

  useEffect(() => {
    // Инициализация данных
    refreshAllData();
    toast.success("Добро пожаловать в раздел метрик");
    
    // Обновление графиков каждые 30 секунд
    const chartInterval = setInterval(() => {
      setMetricsData(generateChartData());
    }, 3600000);
    
    // Обновление статусов каждые 20 секунд
    const statusInterval = setInterval(() => {
      setStatusData(generateStatusData());
    }, 10000);
    
    // Обновление алертов каждые 20 секунд
    const alertInterval = setInterval(() => {
      setActiveAlerts(prev => generateAlerts(prev));
    }, 10000);
    
    // Обновление времени последнего обновления каждую минуту
    const timeInterval = setInterval(() => {
      setLastUpdate(new Date());
    }, 60000);
    
    return () => {
      clearInterval(chartInterval);
      clearInterval(statusInterval);
      clearInterval(alertInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "только что";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} мин назад`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ч назад`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Метрики и мониторинг
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time мониторинг состояния инфраструктуры
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Обновлено: {lastUpdate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "Загружаем..." : "Обновить"}
          </Button>
        </div>
      </div>

      {/* Real-time Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Серверы</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusData.servers.total}</div>
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">
                {statusData.servers.active} активных
              </span>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-600">
                {statusData.servers.warnings} предупреждений
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Базы данных</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusData.databases.total}</div>
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">
                {statusData.databases.active} активных
              </span>
              {statusData.databases.critical > 0 && (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">
                    {statusData.databases.critical} критический
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Сетевые устройства
            </CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusData.network.total}</div>
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">
                {statusData.network.active} активных
              </span>
              {statusData.network.total - statusData.network.active > 0 && (
                <>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-600">
                    {statusData.network.total - statusData.network.active} неактивно
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Активные алерты
            <Badge variant="outline" className="animate-pulse">
              {activeAlerts.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeAlerts.length > 0 ? (
              activeAlerts.map(alert => (
                <div 
                  key={alert.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                    alert.status === "critical" 
                      ? "bg-red-50 border border-red-200" 
                      : "bg-yellow-50 border border-yellow-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle 
                      className={`h-5 w-5 animate-pulse ${
                        alert.status === "critical" ? "text-red-600" : "text-yellow-600"
                      }`} 
                    />
                    <div>
                      <div className={`font-medium ${
                        alert.status === "critical" ? "text-red-800" : "text-yellow-800"
                      }`}>
                        {alert.title}
                      </div>
                      <div className="text-sm flex items-center gap-2">
                        <span className={
                          alert.status === "critical" ? "text-red-600" : "text-yellow-600"
                        }>
                          {alert.description}
                        </span>
                        <span className="text-xs text-gray-500">
                          {timeAgo(alert.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={alert.status === "critical" ? "destructive" : "secondary"}>
                    {alert.status === "critical" ? "Критический" : "Предупреждение"}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                Нет активных алертов
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Обзор системных метрик</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Данные за последние 5 часов (обновляется автоматически)
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={metricsData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorServers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorDatabases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorNetwork" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Статус']}
                  labelFormatter={(label) => `Время: ${label}`}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="servers" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorServers)" 
                  name="Серверы"
                  activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: '#fff' }}
                  animationDuration={1000}
                />
                <Area 
                  type="monotone" 
                  dataKey="databases" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorDatabases)" 
                  name="Базы данных" 
                  animationDuration={1200}
                />
                <Area 
                  type="monotone" 
                  dataKey="network" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorNetwork)" 
                  name="Сеть" 
                  animationDuration={1400}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Metrics;

//рабочий код
// import React, { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import {
//   Activity,
//   AlertTriangle,
//   CheckCircle,
//   RefreshCw,
//   Server,
//   Database,
//   Network,
// } from "lucide-react";
// import { toast } from "@/components/ui/sonner";
// import {
//   AreaChart,
//   Area,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";

// // Генерация данных для последних 5 часов
// const generateHourlyData = () => {
//   const data = [];
//   const now = new Date();
  
//   // Начальные значения
//   let serverValue = 85;
//   let dbValue = 75;
//   let networkValue = 92;
  
//   // Генерируем данные для последних 5 часов
//   for (let i = 4; i >= 0; i--) {
//     const time = new Date(now);
//     time.setHours(now.getHours() - i);
    
//     // Плавные изменения
//     serverValue = Math.max(10, Math.min(100, serverValue + (Math.random() * 4 - 2)));
//     dbValue = Math.max(10, Math.min(100, dbValue + (Math.random() * 3 - 1.5)));
//     networkValue = Math.max(10, Math.min(100, networkValue + (Math.random() * 2 - 1)));
    
//     // Редкие сбои
//     if (Math.random() < 0.1) serverValue = Math.random() * 40;
//     if (Math.random() < 0.05) dbValue = Math.random() * 35;
    
//     data.push({
//       // Форматируем время как "ЧЧ:00"
//       time: `${time.getHours().toString().padStart(2, '0')}:00`,
//       servers: Math.round(serverValue),
//       databases: Math.round(dbValue),
//       network: Math.round(networkValue),
//     });
//   }
  
//   return data;
// };

// const Metrics: React.FC = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [lastUpdate, setLastUpdate] = useState(new Date());
//   const [metricsData, setMetricsData] = useState<any[]>([]);
//   const [activeAlerts] = useState([
//     {
//       id: 1,
//       title: "Высокая нагрузка на DB-01",
//       description: "CPU: 95%, RAM: 87%",
//       status: "critical",
//       timestamp: new Date(Date.now() - 15 * 60000),
//     },
//     {
//       id: 2,
//       title: "Медленный ответ API",
//       description: "Время ответа: 2.3s",
//       status: "warning",
//       timestamp: new Date(Date.now() - 45 * 60000),
//     },
//     {
//       id: 3,
//       title: "Место на диске заканчивается",
//       description: "Свободно: 15% на /var/log",
//       status: "warning",
//       timestamp: new Date(Date.now() - 120 * 60000),
//     },
//   ]);

//   // Функция обновления данных
//   const refreshMetrics = () => {
//     const newData = generateHourlyData();
//     setMetricsData(newData);
//     setLastUpdate(new Date());
//   };

//   const handleRefresh = async () => {
//     setIsLoading(true);
//     toast.success("Начинаем обновление метрик...");

//     // Имитация загрузки
//     setTimeout(() => {
//       toast.success("Получаем данные с серверов мониторинга");
//     }, 1000);

//     setTimeout(() => {
//       refreshMetrics();
//       setIsLoading(false);
//       toast.success("Метрики успешно обновлены");
//     }, 2000);
//   };

//   useEffect(() => {
//     // Инициализация данных при загрузке
//     refreshMetrics();
//     toast.success("Добро пожаловать в раздел метрик");
    
//     // Автоматическое обновление каждые 5 минут
//     const interval = setInterval(() => {
//       refreshMetrics();
//     }, 300000);
    
//     return () => clearInterval(interval);
//   }, []);

//   // Функция для форматирования времени в "time ago" формате
//   const timeAgo = (date: Date) => {
//     const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
//     if (seconds < 60) return "только что";
    
//     const minutes = Math.floor(seconds / 60);
//     if (minutes < 60) return `${minutes} мин назад`;
    
//     const hours = Math.floor(minutes / 60);
//     if (hours < 24) return `${hours} ч назад`;
    
//     return date.toLocaleDateString();
//   };

//   return (
//     <div className="p-6 space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">
//             Метрики и мониторинг
//           </h1>
//           <p className="text-gray-600 mt-1">
//             Real-time мониторинг состояния инфраструктуры
//           </p>
//         </div>
//         <div className="flex items-center gap-3">
//           <span className="text-sm text-gray-500">
//             Обновлено: {lastUpdate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
//           </span>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={handleRefresh}
//             disabled={isLoading}
//           >
//             <RefreshCw
//               className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
//             />
//             {isLoading ? "Загружаем..." : "Обновить"}
//           </Button>
//         </div>
//       </div>

//       {/* Real-time Status */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Серверы</CardTitle>
//             <Server className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">24</div>
//             <div className="flex items-center gap-2 mt-2">
//               <CheckCircle className="h-4 w-4 text-green-600" />
//               <span className="text-sm text-green-600">20 активных</span>
//               <AlertTriangle className="h-4 w-4 text-yellow-600" />
//               <span className="text-sm text-yellow-600">4 предупреждения</span>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Базы данных</CardTitle>
//             <Database className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">8</div>
//             <div className="flex items-center gap-2 mt-2">
//               <CheckCircle className="h-4 w-4 text-green-600" />
//               <span className="text-sm text-green-600">7 активных</span>
//               <AlertTriangle className="h-4 w-4 text-red-600" />
//               <span className="text-sm text-red-600">1 критический</span>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               Сетевые устройства
//             </CardTitle>
//             <Network className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">156</div>
//             <div className="flex items-center gap-2 mt-2">
//               <CheckCircle className="h-4 w-4 text-green-600" />
//               <span className="text-sm text-green-600">все активны</span>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Active Alerts */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Activity className="h-5 w-5" />
//             Активные алерты
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-3">
//             {activeAlerts.map(alert => (
//               <div 
//                 key={alert.id}
//                 className={`flex items-center justify-between p-3 rounded-lg ${
//                   alert.status === "critical" 
//                     ? "bg-red-50 border border-red-200" 
//                     : "bg-yellow-50 border border-yellow-200"
//                 }`}
//               >
//                 <div className="flex items-center gap-3">
//                   <AlertTriangle 
//                     className={`h-5 w-5 ${
//                       alert.status === "critical" ? "text-red-600" : "text-yellow-600"
//                     }`} 
//                   />
//                   <div>
//                     <div className={`font-medium ${
//                       alert.status === "critical" ? "text-red-800" : "text-yellow-800"
//                     }`}>
//                       {alert.title}
//                     </div>
//                     <div className="text-sm flex items-center gap-2">
//                       <span className={
//                         alert.status === "critical" ? "text-red-600" : "text-yellow-600"
//                       }>
//                         {alert.description}
//                       </span>
//                       <span className="text-xs text-gray-500">
//                         {timeAgo(alert.timestamp)}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//                 <Badge variant={alert.status === "critical" ? "destructive" : "secondary"}>
//                   {alert.status === "critical" ? "Критический" : "Предупреждение"}
//                 </Badge>
//               </div>
//             ))}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Metrics Overview */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Обзор системных метрик</CardTitle>
//           <p className="text-sm text-gray-500 mt-1">
//             Данные за последние 5 часов (обновляется автоматически)
//           </p>
//         </CardHeader>
//         <CardContent>
//           <div className="h-80">
//             <ResponsiveContainer width="100%" height="100%">
//               <AreaChart
//                 data={metricsData}
//                 margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
//               >
//                 <defs>
//                   <linearGradient id="colorServers" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor="#f87171" stopOpacity={0.4}/>
//                     <stop offset="95%" stopColor="#f87171" stopOpacity={0.05}/>
//                   </linearGradient>
//                   <linearGradient id="colorDatabases" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4}/>
//                     <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.05}/>
//                   </linearGradient>
//                   <linearGradient id="colorNetwork" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor="#34d399" stopOpacity={0.4}/>
//                     <stop offset="95%" stopColor="#34d399" stopOpacity={0.05}/>
//                   </linearGradient>
//                 </defs>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
//                 <XAxis 
//                   dataKey="time" 
//                   tick={{ fontSize: 12 }}
//                 />
//                 <YAxis domain={[0, 100]} />
//                 <Tooltip 
//                   formatter={(value) => [`${value}%`, 'Статус']}
//                   labelFormatter={(label) => `Время: ${label}`}
//                   contentStyle={{ 
//                     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//                     borderRadius: '6px',
//                     border: '1px solid #e5e7eb',
//                     boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
//                   }}
//                 />
//                 <Legend />
//                 <Area 
//                   type="monotone" 
//                   dataKey="servers" 
//                   stroke="#ef4444" 
//                   strokeWidth={2}
//                   fillOpacity={1} 
//                   fill="url(#colorServers)" 
//                   name="Серверы"
//                   activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: '#fff' }}
//                   animationDuration={1000}
//                 />
//                 <Area 
//                   type="monotone" 
//                   dataKey="databases" 
//                   stroke="#3b82f6" 
//                   strokeWidth={2}
//                   fillOpacity={1} 
//                   fill="url(#colorDatabases)" 
//                   name="Базы данных" 
//                   animationDuration={1200}
//                 />
//                 <Area 
//                   type="monotone" 
//                   dataKey="network" 
//                   stroke="#10b981" 
//                   strokeWidth={2}
//                   fillOpacity={1} 
//                   fill="url(#colorNetwork)" 
//                   name="Сеть" 
//                   animationDuration={1400}
//                 />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default Metrics;






// import React, { useState, useEffect, useCallback } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import {
//   Activity,
//   AlertTriangle,
//   CheckCircle,
//   RefreshCw,
//   Server,
//   Database,
//   Network,
// } from "lucide-react";
// import { toast } from "@/components/ui/sonner";
// import {
//   LineChart,
//   Line,
//   AreaChart,
//   Area,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";

// // Генерация случайных данных для графиков
// const generateServerData = () => {
//   const data = [];
//   const now = new Date();
  
//   for (let i = 24; i >= 0; i--) {
//     const time = new Date(now);
//     time.setHours(now.getHours() - i);
    
//     // Генерация случайных сбоев
//     const isFailure = Math.random() < 0.1;
//     const isWarning = Math.random() < 0.2;
    
//     data.push({
//       time: time.getHours().toString().padStart(2, '0') + ':00',
//       servers: isFailure ? Math.floor(Math.random() * 30) : 
//               isWarning ? 50 + Math.floor(Math.random() * 30) : 
//               80 + Math.floor(Math.random() * 20),
//       databases: 70 + Math.floor(Math.random() * 30),
//       network: 85 + Math.floor(Math.random() * 15),
//     });
//   }
  
//   return data;
// };

// const Metrics: React.FC = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [lastUpdate, setLastUpdate] = useState(new Date());
//   const [metricsData, setMetricsData] = useState<any[]>([]);
//   const [activeAlerts, setActiveAlerts] = useState([
//     {
//       id: 1,
//       title: "Высокая нагрузка на DB-01",
//       description: "CPU: 95%, RAM: 87%",
//       status: "critical",
//       timestamp: new Date(Date.now() - 15 * 60000),
//     },
//     {
//       id: 2,
//       title: "Медленный ответ API",
//       description: "Время ответа: 2.3s",
//       status: "warning",
//       timestamp: new Date(Date.now() - 45 * 60000),
//     },
//     {
//       id: 3,
//       title: "Место на диске заканчивается",
//       description: "Свободно: 15% на /var/log",
//       status: "warning",
//       timestamp: new Date(Date.now() - 120 * 60000),
//     },
//   ]);

//   // Функция обновления данных
//   const updateMetrics = useCallback(() => {
//     const newData = generateServerData();
//     setMetricsData(newData);
    
//     // Обновление алертов
//     const updatedAlerts = activeAlerts.map(alert => {
//       // С 20% шансом улучшим статус алерта
//       if (Math.random() < 0.2 && alert.status !== "resolved") {
//         return {...alert, status: "resolved"};
//       }
//       return alert;
//     }).filter(alert => alert.status !== "resolved");
    
//     // С 10% шансом добавим новый алерт
//     if (Math.random() < 0.1) {
//       const newAlerts = [
//         {
//           id: Date.now(),
//           title: "Пиковая нагрузка на сервер " + Math.floor(Math.random() * 10),
//           description: `CPU: ${85 + Math.floor(Math.random() * 15)}%`,
//           status: "warning",
//           timestamp: new Date(),
//         },
//         {
//           id: Date.now() + 1,
//           title: "Сетевая задержка увеличилась",
//           description: `Latency: ${120 + Math.floor(Math.random() * 100)}ms`,
//           status: "critical",
//           timestamp: new Date(),
//         }
//       ];
//       updatedAlerts.push(newAlerts[Math.floor(Math.random() * newAlerts.length)]);
//     }
    
//     setActiveAlerts(updatedAlerts);
//   }, [activeAlerts]);

//   const handleRefresh = async () => {
//     setIsLoading(true);
//     toast.success("Начинаем обновление метрик...");

//     // Имитация загрузки
//     setTimeout(() => {
//       toast.success("Получаем данные с серверов мониторинга");
//     }, 1000);

//     setTimeout(() => {
//       updateMetrics();
//       setIsLoading(false);
//       setLastUpdate(new Date());
//       toast.success("Метрики успешно обновлены");
//     }, 3000);
//   };

//   useEffect(() => {
//     // Инициализация данных при загрузке
//     updateMetrics();
//     toast.success("Добро пожаловать в раздел метрик");
    
//     // Автоматическое обновление каждые 60 секунд
//     const interval = setInterval(() => {
//       updateMetrics();
//       setLastUpdate(new Date());
//     }, 60000);
    
//     return () => clearInterval(interval);
//   }, [updateMetrics]);

//   // Функция для форматирования времени в "time ago" формате
//   const timeAgo = (date: Date) => {
//     const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
//     if (seconds < 60) return "только что";
    
//     const minutes = Math.floor(seconds / 60);
//     if (minutes < 60) return `${minutes} мин назад`;
    
//     const hours = Math.floor(minutes / 60);
//     if (hours < 24) return `${hours} ч назад`;
    
//     return date.toLocaleDateString();
//   };

//   return (
//     <div className="p-6 space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">
//             Метрики и мониторинг
//           </h1>
//           <p className="text-gray-600 mt-1">
//             Real-time мониторинг состояния инфраструктуры
//           </p>
//         </div>
//         <div className="flex items-center gap-3">
//           <span className="text-sm text-gray-500">
//             Обновлено: {lastUpdate.toLocaleTimeString()}
//           </span>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={handleRefresh}
//             disabled={isLoading}
//           >
//             <RefreshCw
//               className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
//             />
//             {isLoading ? "Загружаем..." : "Обновить"}
//           </Button>
//         </div>
//       </div>

//       {/* Real-time Status */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Серверы</CardTitle>
//             <Server className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">24</div>
//             <div className="flex items-center gap-2 mt-2">
//               <CheckCircle className="h-4 w-4 text-green-600" />
//               <span className="text-sm text-green-600">20 активных</span>
//               <AlertTriangle className="h-4 w-4 text-yellow-600" />
//               <span className="text-sm text-yellow-600">4 предупреждения</span>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Базы данных</CardTitle>
//             <Database className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">8</div>
//             <div className="flex items-center gap-2 mt-2">
//               <CheckCircle className="h-4 w-4 text-green-600" />
//               <span className="text-sm text-green-600">7 активных</span>
//               <AlertTriangle className="h-4 w-4 text-red-600" />
//               <span className="text-sm text-red-600">1 критический</span>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               Сетевые устройства
//             </CardTitle>
//             <Network className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">156</div>
//             <div className="flex items-center gap-2 mt-2">
//               <CheckCircle className="h-4 w-4 text-green-600" />
//               <span className="text-sm text-green-600">все активны</span>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Active Alerts */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Activity className="h-5 w-5" />
//             Активные алерты
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-3">
//             {activeAlerts.map(alert => (
//               <div 
//                 key={alert.id}
//                 className={`flex items-center justify-between p-3 rounded-lg ${
//                   alert.status === "critical" 
//                     ? "bg-red-50 border border-red-200" 
//                     : "bg-yellow-50 border border-yellow-200"
//                 }`}
//               >
//                 <div className="flex items-center gap-3">
//                   <AlertTriangle 
//                     className={`h-5 w-5 ${
//                       alert.status === "critical" ? "text-red-600" : "text-yellow-600"
//                     }`} 
//                   />
//                   <div>
//                     <div className={`font-medium ${
//                       alert.status === "critical" ? "text-red-800" : "text-yellow-800"
//                     }`}>
//                       {alert.title}
//                     </div>
//                     <div className="text-sm flex items-center gap-2">
//                       <span className={
//                         alert.status === "critical" ? "text-red-600" : "text-yellow-600"
//                       }>
//                         {alert.description}
//                       </span>
//                       <span className="text-xs text-gray-500">
//                         {timeAgo(alert.timestamp)}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//                 <Badge variant={alert.status === "critical" ? "destructive" : "secondary"}>
//                   {alert.status === "critical" ? "Критический" : "Предупреждение"}
//                 </Badge>
//               </div>
//             ))}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Metrics Overview */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Обзор системных метрик</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="h-80">
//             <ResponsiveContainer width="100%" height="100%">
//               <AreaChart
//                 data={metricsData}
//                 margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
//               >
//                 <defs>
//                   <linearGradient id="colorServers" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
//                     <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
//                   </linearGradient>
//                   <linearGradient id="colorDatabases" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
//                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
//                   </linearGradient>
//                   <linearGradient id="colorNetwork" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
//                     <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
//                   </linearGradient>
//                 </defs>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                 <XAxis dataKey="time" />
//                 <YAxis domain={[0, 100]} />
//                 <Tooltip 
//                   formatter={(value) => [`${value}%`, 'Статус']}
//                   labelFormatter={(label) => `Время: ${label}`}
//                 />
//                 <Legend />
//                 <Area 
//                   type="monotone" 
//                   dataKey="servers" 
//                   stroke="#ef4444" 
//                   fillOpacity={1} 
//                   fill="url(#colorServers)" 
//                   name="Серверы"
//                   activeDot={{ r: 8 }}
//                 />
//                 <Area 
//                   type="monotone" 
//                   dataKey="databases" 
//                   stroke="#3b82f6" 
//                   fillOpacity={1} 
//                   fill="url(#colorDatabases)" 
//                   name="Базы данных" 
//                 />
//                 <Area 
//                   type="monotone" 
//                   dataKey="network" 
//                   stroke="#22c55e" 
//                   fillOpacity={1} 
//                   fill="url(#colorNetwork)" 
//                   name="Сеть" 
//                 />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Additional Charts */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <Card>
//           <CardHeader>
//             <CardTitle>Статус серверов</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="h-64">
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart
//                   data={metricsData}
//                   margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
//                 >
//                   <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                   <XAxis dataKey="time" />
//                   <YAxis domain={[0, 100]} />
//                   <Tooltip />
//                   <Legend />
//                   <Line
//                     type="monotone"
//                     dataKey="servers"
//                     stroke="#ef4444"
//                     strokeWidth={2}
//                     activeDot={{ r: 8 }}
//                     name="Статус серверов (%)"
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>История инцидентов</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="h-64">
//               <ResponsiveContainer width="100%" height="100%">
//                 <AreaChart
//                   data={metricsData}
//                   margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
//                 >
//                   <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                   <XAxis dataKey="time" />
//                   <YAxis hide />
//                   <Tooltip />
//                   <Area
//                     type="step"
//                     dataKey="servers"
//                     stroke="#ef4444"
//                     fill="#fee2e2"
//                     name="Критические инциденты"
//                     strokeWidth={2}
//                   />
//                 </AreaChart>
//               </ResponsiveContainer>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default Metrics;





// import React, { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import {
//   Activity,
//   AlertTriangle,
//   CheckCircle,
//   RefreshCw,
//   Server,
//   Database,
//   Network,
// } from "lucide-react";
// import { toast } from "@/components/ui/sonner";

// const Metrics: React.FC = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [lastUpdate, setLastUpdate] = useState(new Date());

//   const handleRefresh = async () => {
//     setIsLoading(true);
//     toast.success("Начинаем обновление метрик...");

//     // Имитация загрузки
//     setTimeout(() => {
//       toast.success("Получаем данные с серверов мониторинга");
//     }, 1000);

//     setTimeout(() => {
//       setIsLoading(false);
//       setLastUpdate(new Date());
//       toast.success("Метрики успешно обновлены");
//     }, 3000);
//   };

//   useEffect(() => {
//     // Автоматическое приветствие при загрузке страницы
//     toast.success("Добро пожаловать в раздел метрик");
//   }, []);

//   return (
//     <div className="p-6 space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">
//             Метрики и мониторинг
//           </h1>
//           <p className="text-gray-600 mt-1">
//             Real-time мониторинг состояния инфраструктуры
//           </p>
//         </div>
//         <div className="flex items-center gap-3">
//           <span className="text-sm text-gray-500">
//             Обновлено: {lastUpdate.toLocaleTimeString()}
//           </span>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={handleRefresh}
//             disabled={isLoading}
//           >
//             <RefreshCw
//               className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
//             />
//             {isLoading ? "Загружаем..." : "Обновить"}
//           </Button>
//         </div>
//       </div>

//       {/* Real-time Status */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Серверы</CardTitle>
//             <Server className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">24</div>
//             <div className="flex items-center gap-2 mt-2">
//               <CheckCircle className="h-4 w-4 text-green-600" />
//               <span className="text-sm text-green-600">20 активных</span>
//               <AlertTriangle className="h-4 w-4 text-yellow-600" />
//               <span className="text-sm text-yellow-600">4 предупреждения</span>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Базы данных</CardTitle>
//             <Database className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">8</div>
//             <div className="flex items-center gap-2 mt-2">
//               <CheckCircle className="h-4 w-4 text-green-600" />
//               <span className="text-sm text-green-600">7 активных</span>
//               <AlertTriangle className="h-4 w-4 text-red-600" />
//               <span className="text-sm text-red-600">1 критический</span>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               Сетевые устройства
//             </CardTitle>
//             <Network className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">156</div>
//             <div className="flex items-center gap-2 mt-2">
//               <CheckCircle className="h-4 w-4 text-green-600" />
//               <span className="text-sm text-green-600">все активны</span>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Active Alerts */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Activity className="h-5 w-5" />
//             Активные алерты
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-3">
//             <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
//               <div className="flex items-center gap-3">
//                 <AlertTriangle className="h-5 w-5 text-red-600" />
//                 <div>
//                   <div className="font-medium text-red-800">
//                     Высокая нагрузка на DB-01
//                   </div>
//                   <div className="text-sm text-red-600">CPU: 95%, RAM: 87%</div>
//                 </div>
//               </div>
//               <Badge variant="destructive">Критический</Badge>
//             </div>

//             <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
//               <div className="flex items-center gap-3">
//                 <AlertTriangle className="h-5 w-5 text-yellow-600" />
//                 <div>
//                   <div className="font-medium text-yellow-800">
//                     Медленный ответ API
//                   </div>
//                   <div className="text-sm text-yellow-600">
//                     Время ответа: 2.3s
//                   </div>
//                 </div>
//               </div>
//               <Badge variant="secondary">Предупреждение</Badge>
//             </div>

//             <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
//               <div className="flex items-center gap-3">
//                 <AlertTriangle className="h-5 w-5 text-yellow-600" />
//                 <div>
//                   <div className="font-medium text-yellow-800">
//                     Место на диске заканчивается
//                   </div>
//                   <div className="text-sm text-yellow-600">
//                     Свободно: 15% на /var/log
//                   </div>
//                 </div>
//               </div>
//               <Badge variant="secondary">Предупреждение</Badge>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Metrics Overview */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Обзор системных метрик</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="text-center py-12 text-gray-500">
//             <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
//             <h3 className="text-lg font-medium mb-2">Графики метрик</h3>
//             <p className="text-sm">
//               Здесь будут отображаться детальные графики
//               <br />
//               производительности и исторические данные
//             </p>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default Metrics;
