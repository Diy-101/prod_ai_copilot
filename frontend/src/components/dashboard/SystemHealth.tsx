import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface HealthItem {
  name: string;
  health: number;
  status: 'healthy' | 'warning' | 'critical';
  type: string;
}

const initialHealthData: HealthItem[] = [
  { name: 'Web Server 01', health: 95, status: 'healthy', type: 'server' },
  { name: 'Database Cluster', health: 78, status: 'warning', type: 'database' },
  { name: 'Load Balancer', health: 92, status: 'healthy', type: 'network' },
  { name: 'API Gateway', health: 65, status: 'critical', type: 'service' },
  { name: 'Cache Redis', health: 88, status: 'healthy', type: 'database' },
];

const statusColors = {
  healthy: 'bg-green-500',
  warning: 'bg-yellow-500',
  critical: 'bg-red-500'
};

const statusLabels = {
  healthy: 'Здоров',
  warning: 'Предупреждение',
  critical: 'Критично'
};

export const SystemHealth: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthItem[]>(initialHealthData);

  useEffect(() => {
    const interval = setInterval(() => {
      setHealthData(prevData => 
        prevData.map(item => {
          const newHealth = Math.floor(Math.random() * 101);
          
          // Определяем статус на основе нового значения здоровья
          let newStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
          if (newHealth < 50) {
            newStatus = 'critical';
          } else if (newHealth < 80) {
            newStatus = 'warning';
          }
          
          return {
            ...item,
            health: newHealth,
            status: newStatus
          };
        })
      );
    }, 20000); // 30сек

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Здоровье системы</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {healthData.map((item) => (
            <div key={item.name} className="flex items-center justify-between space-x-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                  </p>
                  <Badge 
                    variant="secondary"
                    className={`text-white ${statusColors[item.status]}`}
                  >
                    {statusLabels[item.status]}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress 
                    value={item.health} 
                    className="flex-1"
                    // @ts-ignore
                    indicatorClassName={statusColors[item.status]}
                  />
                  <span className="text-sm text-gray-500 min-w-8">
                    {item.health}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};



// import React from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Progress } from '@/components/ui/progress';
// import { Badge } from '@/components/ui/badge';

// interface HealthItem {
//   name: string;
//   health: number;
//   status: 'healthy' | 'warning' | 'critical';
//   type: string;
// }

// const mockHealthData: HealthItem[] = [
//   { name: 'Web Server 01', health: 95, status: 'healthy', type: 'server' },
//   { name: 'Database Cluster', health: 78, status: 'warning', type: 'database' },
//   { name: 'Load Balancer', health: 92, status: 'healthy', type: 'network' },
//   { name: 'API Gateway', health: 65, status: 'critical', type: 'service' },
//   { name: 'Cache Redis', health: 88, status: 'healthy', type: 'database' },
// ];

// const statusColors = {
//   healthy: 'bg-green-500',
//   warning: 'bg-yellow-500',
//   critical: 'bg-red-500'
// };

// const statusLabels = {
//   healthy: 'Здоров',
//   warning: 'Предупреждение',
//   critical: 'Критично'
// };

// export const SystemHealth: React.FC = () => {
//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Здоровье системы</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="space-y-4">
//           {mockHealthData.map((item) => (
//             <div key={item.name} className="flex items-center justify-between space-x-4">
//               <div className="flex-1 min-w-0">
//                 <div className="flex items-center justify-between mb-1">
//                   <p className="text-sm font-medium text-gray-900 truncate">
//                     {item.name}
//                   </p>
//                   <Badge 
//                     variant="secondary"
//                     className={`text-white ${statusColors[item.status]}`}
//                   >
//                     {statusLabels[item.status]}
//                   </Badge>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <Progress 
//                     value={item.health} 
//                     className="flex-1"
//                     // @ts-ignore
//                     indicatorClassName={statusColors[item.status]}
//                   />
//                   <span className="text-sm text-gray-500 min-w-8">
//                     {item.health}%
//                   </span>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </CardContent>
//     </Card>
//   );
// };
