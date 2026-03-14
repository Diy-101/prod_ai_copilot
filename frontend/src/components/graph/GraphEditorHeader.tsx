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
  <div className="p-6 border-b border-border bg-card">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Pipelines Editor</h1>
        <Badge variant={hasChanges ? "destructive" : "secondary"} className="bg-primary/20 text-primary border-primary/20 hover:bg-primary/30">
          {hasChanges ? "Изменено" : "Сохранено"}
        </Badge>
        <span className="text-sm text-muted-foreground font-mono">
          Steps: {nodesCount} | Zoom: {Math.round(zoom * 100)}%
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onImport} className="border-border hover:bg-accent">
          <Upload className="h-4 w-4 mr-2" />
          Import Flow
        </Button>
        <Button variant="outline" size="sm" onClick={onExport} className="border-border hover:bg-accent">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm" onClick={onSave} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
          <Save className="h-4 w-4 mr-2" />
          Save Pipeline
        </Button>
      </div>
    </div>
  </div>
);

export default GraphEditorHeader;
