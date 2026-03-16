import React, { useEffect, useRef, useState } from "react";
import { FileCode, FileJson, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ENDPOINTS } from "@/constants/api";
import { apiRequest } from "@/lib/api";

interface SwaggerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => void;
}

const uploadSpec = async (file: Blob, filename: string) => {
  const formData = new FormData();
  formData.append("file", file, filename);
  return apiRequest<any>(ENDPOINTS.ACTIONS.INGEST, {
    method: "POST",
    body: formData,
  });
};

export const SwaggerImportModal: React.FC<SwaggerImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [spec, setSpec] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setSpec("");
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const isJsonOrYaml =
      file.type === "application/json" ||
      file.name.endsWith(".json") ||
      file.name.endsWith(".yaml") ||
      file.name.endsWith(".yml");

    if (!isJsonOrYaml) {
      toast.error("Please select a JSON or YAML file");
      return;
    }

    setSelectedFile(file);
  };

  const handleImportFile = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setIsImporting(true);
    try {
      const result = await uploadSpec(selectedFile, selectedFile.name);
      toast.success(`File ${selectedFile.name} imported successfully`);
      onImport(result);
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportByContent = async () => {
    if (!spec.trim()) {
      toast.error("Please paste a specification first");
      return;
    }

    setIsImporting(true);
    try {
      const specBlob = new Blob([spec], { type: "application/json" });
      const result = await uploadSpec(specBlob, "manual_import.json");
      toast.success("Specification imported successfully");
      onImport(result);
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" />
            Import Swagger / OpenAPI
          </DialogTitle>
          <DialogDescription>
            Upload a JSON/YAML OpenAPI spec or paste its content.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="file" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="file" className="gap-2">
              <FileJson className="h-4 w-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2">
              <Upload className="h-4 w-4" />
              Paste Content
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4 pt-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,.yaml,.yml"
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              {selectedFile ? selectedFile.name : "Choose file"}
            </Button>

            <Button
              className="w-full gap-2"
              onClick={handleImportFile}
              disabled={isImporting || !selectedFile}
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isImporting ? "Importing..." : "Import from file"}
            </Button>
          </TabsContent>

          <TabsContent value="content" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="swagger-content">Content</Label>
              <Textarea
                id="swagger-content"
                placeholder='{"openapi": "3.0.0", ...}'
                className="min-h-[250px] font-mono text-xs bg-background border-border"
                value={spec}
                onChange={(e) => setSpec(e.target.value)}
                disabled={isImporting}
              />
            </div>
            <Button
              className="w-full gap-2"
              onClick={handleImportByContent}
              disabled={isImporting}
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isImporting ? "Importing..." : "Import methods"}
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter className="sm:justify-start">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            SECURE LOCAL PROCESSING
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
