import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Download, Upload } from "lucide-react";

interface GraphEditorHeaderProps {
  hasChanges: boolean;
  nodesCount: number;
  zoom: number;
  onImport: () => void;
  onExport: () => void;
  onSave: () => void;
}

export const GraphEditorHeader: React.FC<GraphEditorHeaderProps> = ({
  hasChanges,
  nodesCount,
  zoom,
  onImport,
  onExport,
  onSave,
}) => (
  <div className="p-6 border-b border-gray-200 bg-white">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Редактор графа</h1>
        <Badge variant={hasChanges ? "destructive" : "secondary"}>
          {hasChanges ? "Не сохранено" : "Сохранено"}
        </Badge>
        <span className="text-sm text-gray-500">
          Узлов: {nodesCount} | Масштаб: {Math.round(zoom * 100)}%
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onImport}>
          <Upload className="h-4 w-4 mr-2" />
          Импорт
        </Button>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Экспорт
        </Button>
        <Button size="sm" onClick={onSave}>
          <Save className="h-4 w-4 mr-2" />
          Сохранить
        </Button>
      </div>
    </div>
  </div>
);

export default GraphEditorHeader;
