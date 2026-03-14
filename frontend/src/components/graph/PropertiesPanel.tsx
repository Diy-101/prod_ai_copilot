import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraphNode, GraphLink } from "@/types/graph";
import { Settings, Trash2, Save, Edit, Eye } from "lucide-react";
import { toast } from "sonner";
import { getNodePropertiesSchema } from "@/lib/nodeRedUtils";

interface PropertiesPanelProps {
  selectedNode: GraphNode | null;
  onUpdateNode: (nodeId: string, updates: Partial<GraphNode>) => void;
  onDeleteNode: (nodeId: string) => void;
  links: GraphLink[];
  onSelectLink: (linkId: string) => void;
  selectedLinkId: string | null;
  flow: { id: string; name: string; nodes: GraphNode[]; links: GraphLink[] };
  isNodeSelected: boolean;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
  links,
  onSelectLink,
  selectedLinkId,
  flow,
  isNodeSelected,
}) => {
  const [editingProperty, setEditingProperty] = React.useState<string | null>(
    null
  );
  const [editValue, setEditValue] = React.useState<string>("");

  // Получаем схему свойств для выбранного узла
  const propertiesSchema = selectedNode
    ? getNodePropertiesSchema(selectedNode.type)
    : [];

  const handlePropertyEdit = (propertyName: string, currentValue: any) => {
    setEditingProperty(propertyName);
    setEditValue(
      typeof currentValue === "object"
        ? JSON.stringify(currentValue, null, 2)
        : String(currentValue)
    );
  };

  const handlePropertySave = (propertyName: string) => {
    if (!selectedNode) return;

    let newValue: any = editValue;

    // Пытаемся парсить JSON для сложных значений
    if (editValue.trim().startsWith("{") || editValue.trim().startsWith("[")) {
      try {
        newValue = JSON.parse(editValue);
      } catch {
        // Если не удалось распарсить, оставляем как строку
      }
    }

    onUpdateNode(selectedNode.id, {
      properties: {
        ...selectedNode.properties,
        [propertyName]: newValue,
      },
    });

    setEditingProperty(null);
    setEditValue("");
    toast.success(`Свойство ${propertyName} обновлено`);
  };

  const handlePropertyCancel = () => {
    setEditingProperty(null);
    setEditValue("");
  };

  const renderPropertyValue = (property: any, value: any) => {
    if (editingProperty === property.name) {
      return (
        <div className="space-y-2">
          <textarea
            className="w-full px-2 py-1 text-xs border rounded"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={3}
          />
          <div className="flex gap-1">
            <Button
              size="sm"
              className="text-xs px-2 py-1"
              onClick={() => handlePropertySave(property.name)}
            >
              <Save className="h-3 w-3 mr-1" />
              Сохранить
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs px-2 py-1"
              onClick={handlePropertyCancel}
            >
              Отмена
            </Button>
          </div>
        </div>
      );
    }

    const displayValue =
      typeof value === "object" ? JSON.stringify(value) : String(value);

    return (
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600 truncate max-w-[150px]">
          {displayValue}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs p-1 h-auto"
          onClick={() => handlePropertyEdit(property.name, value)}
        >
          <Edit className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Информация о потоке */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Информация о потоке</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            <div className="font-bold">{flow.name}</div>
            <div className="text-sm text-gray-600">ID: {flow.id}</div>
            <div className="text-sm">Узлов: {flow.nodes.length}</div>
            <div className="text-sm">Связей: {flow.links.length}</div>
            <div className="text-xs text-gray-500 pt-2">
              Здесь вы можете создавать и настраивать потоки обработки данных,
              соединяя инфраструктурные компоненты.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Информация о выбранном узле */}
      {isNodeSelected && selectedNode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Настройки узла
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Основная информация */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500">ID узла</Label>
                  <div className="text-sm font-mono bg-gray-50 px-2 py-1 rounded">
                    {selectedNode.id}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Тип узла</Label>
                  <div className="text-sm bg-blue-50 px-2 py-1 rounded">
                    {selectedNode.type}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Название</Label>
                  <Input
                    value={selectedNode.name}
                    onChange={(e) =>
                      onUpdateNode(selectedNode.id, { name: e.target.value })
                    }
                    className="text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500">Статус</Label>
                    <div className="text-sm bg-gray-100 px-3 py-2 rounded border text-gray-700">
                      {selectedNode.status === "healthy" && "Здоровый"}
                      {selectedNode.status === "warning" && "Предупреждение"}
                      {selectedNode.status === "critical" && "Критический"}
                      {selectedNode.status === "unknown" && "Неизвестно"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">
                      Здоровье (%)
                    </Label>
                    <div className="text-sm bg-gray-100 px-3 py-2 rounded border text-gray-700">
                      {selectedNode.health}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Свойства узла */}
              {propertiesSchema.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <Label className="text-sm font-medium">Свойства узла</Label>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {propertiesSchema.map((property) => {
                      const value =
                        selectedNode.properties[property.name] ??
                        property.value;
                      return (
                        <div
                          key={property.name}
                          className="border rounded p-3 bg-gray-50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs font-medium text-gray-700">
                              {property.description || property.name}
                              {property.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </Label>
                          </div>
                          {renderPropertyValue(property, value)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Действия с узлом */}
              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteNode(selectedNode.id)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить узел
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Связи */}
      {links.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Связи</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {links.map((link) => (
                <div
                  key={link.id}
                  className={`p-2 rounded cursor-pointer text-sm ${
                    selectedLinkId === link.id
                      ? "bg-blue-100 border border-blue-300"
                      : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                  }`}
                  onClick={() => onSelectLink(link.id)}
                >
                  <div className="font-medium">
                    {link.source} → {link.target}
                  </div>
                  <div className="text-xs text-gray-500">
                    Тип: {link.type} | Статус: {link.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
