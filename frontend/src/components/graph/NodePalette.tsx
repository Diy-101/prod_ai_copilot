import React from "react";
import {
  Zap,
  Bug,
  Code2,
  Shuffle,
  GitBranch,
  FileText,
  Wifi,
  Globe,
  File,
  Filter,
  HardDrive,
  Database,
  Clock,
  Link2,
  Settings,
  Server,
  Network,
  Cloud,
  Info,
} from "lucide-react";
import type { NodeType } from "@/types/graph";
import { getNodePropertiesSchema } from "@/lib/nodeRedUtils";

interface NodePaletteProps {
  onAddNode: (type: NodeType) => void;
}

// Описания узлов
const nodeDescriptions: Record<NodeType, string> = {
  inject: "Запускает поток, отправляя сообщения по расписанию или вручную",
  debug: "Отображает сообщения в отладочной панели",
  function: "Выполняет пользовательский JavaScript код",
  change: "Изменяет свойства сообщений по заданным правилам",
  switch: "Направляет сообщения по разным выходам на основе условий",
  template: "Форматирует сообщения с помощью шаблонов",
  mqtt: "Отправляет и получает сообщения через MQTT протокол",
  http: "Выполняет HTTP запросы к внешним API",
  file: "Читает и записывает файлы",
  serial: "Работает с последовательными портами",
  json: "Парсит и форматирует JSON данные",
  split: "Разделяет и объединяет сообщения",
  delay: "Задерживает или ограничивает поток сообщений",
  rbe: "Отправляет сообщения только при изменении данных",
  link: "Создает связи между разными потоками",
  server: "Представляет сервер в системе",
  database: "Представляет базу данных",
  network: "Представляет сетевой интерфейс",
  service: "Представляет системный сервис",
  api: "Представляет API endpoint",
  storage: "Представляет хранилище данных",
};

const nodeGroups = [
  {
    group: "Логика",
    color: "bg-yellow-50 hover:bg-yellow-100",
    nodes: [
      { type: "inject" as const, icon: Zap, label: "Inject" },
      { type: "debug" as const, icon: Bug, label: "Debug" },
      { type: "function" as const, icon: Code2, label: "Function" },
      { type: "change" as const, icon: Shuffle, label: "Change" },
      { type: "switch" as const, icon: GitBranch, label: "Switch" },
      { type: "template" as const, icon: FileText, label: "Template" },
    ],
  },
  {
    group: "Интеграция",
    color: "bg-cyan-50 hover:bg-cyan-100",
    nodes: [
      { type: "mqtt" as const, icon: Wifi, label: "MQTT" },
      { type: "http" as const, icon: Globe, label: "HTTP" },
      { type: "file" as const, icon: File, label: "File" },
      { type: "serial" as const, icon: HardDrive, label: "Serial" },
      { type: "json" as const, icon: Database, label: "JSON" },
    ],
  },
  {
    group: "Поток",
    color: "bg-purple-50 hover:bg-purple-100",
    nodes: [
      { type: "split" as const, icon: GitBranch, label: "Split/Join" },
      { type: "delay" as const, icon: Clock, label: "Delay" },
      { type: "rbe" as const, icon: Filter, label: "RBE" },
      { type: "link" as const, icon: Link2, label: "Link" },
    ],
  },
  {
    group: "Система",
    color: "bg-blue-50 hover:bg-blue-100",
    nodes: [
      { type: "server" as const, icon: Server, label: "Сервер" },
      { type: "database" as const, icon: Database, label: "БД" },
      { type: "network" as const, icon: Network, label: "Сеть" },
      { type: "service" as const, icon: Settings, label: "Сервис" },
      { type: "api" as const, icon: Cloud, label: "API" },
      { type: "storage" as const, icon: Database, label: "Хранилище" },
    ],
  },
];

export const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode }) => {
  const [hoveredNode, setHoveredNode] = React.useState<NodeType | null>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });

  // dragstart handler
  const handleDragStart = (e: React.DragEvent, type: NodeType) => {
    e.dataTransfer.setData("application/node-type", type);
  };

  const handleNodeMouseEnter = (e: React.MouseEvent, type: NodeType) => {
    setHoveredNode(type);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const handleNodeMouseLeave = () => {
    setHoveredNode(null);
  };

  const getNodeProperties = (type: NodeType) => {
    const schema = getNodePropertiesSchema(type);
    return schema.slice(0, 3); // Показываем только первые 3 свойства
  };

  return (
    <div className="relative">
      {nodeGroups.map(({ group, color, nodes }) => (
        <div key={group} className="mb-4">
          <div className="font-bold text-xs text-gray-700 mb-2 pl-1 uppercase tracking-wider">
            {group}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {nodes.map(({ type, icon: Icon, label }) => (
              <div
                key={type}
                className={`h-16 flex flex-col items-center justify-center ${color} border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer select-none relative group`}
                draggable
                onDragStart={(e) => handleDragStart(e, type)}
                onMouseEnter={(e) => handleNodeMouseEnter(e, type)}
                onMouseLeave={handleNodeMouseLeave}
                onClick={() => onAddNode(type)}
                tabIndex={0}
                role="button"
                title={label}
              >
                <Icon className="h-6 w-6 mb-1" />
                <span className="text-xs">{label}</span>

                {/* Индикатор информации */}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Info className="h-3 w-3 text-gray-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Всплывающая подсказка */}
      {hoveredNode && (
        <div
          className="fixed z-[1000] bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
          }}
        >
          <div className="flex items-center mb-2">
            <h3 className="font-semibold text-gray-900">{hoveredNode}</h3>
          </div>

          <p className="text-sm text-gray-600 mb-3">
            {nodeDescriptions[hoveredNode]}
          </p>

          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              Основные свойства:
            </h4>
            {getNodeProperties(hoveredNode).map((prop) => (
              <div key={prop.name} className="text-xs">
                <span className="font-medium text-gray-700">{prop.name}:</span>
                <span className="text-gray-500 ml-1">{prop.description}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Перетащите узел на canvas или кликните для добавления
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
