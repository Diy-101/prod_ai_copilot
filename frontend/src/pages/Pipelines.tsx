import React from 'react';
import { useLocation } from 'react-router-dom';
import { SynthesisChat } from '@/components/shared/SynthesisChat';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Settings, Database, ArrowRight, Activity, Zap, Box, Server } from 'lucide-react';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { cn } from '@/lib/utils';

export const Pipelines: React.FC = () => {
  const location = useLocation();
  const initialMessage = location.state?.initialMessage;
  const { currentPipeline } = usePipelineContext();

  const getNodeIcon = (index: number) => {
    switch (index % 4) {
      case 0: return <Zap className="h-5 w-5" />;
      case 1: return <Settings className="h-5 w-5" />;
      case 2: return <Database className="h-5 w-5" />;
      case 3: return <Server className="h-5 w-5" />;
      default: return <Box className="h-5 w-5" />;
    }
  };

  const getIconColor = (index: number) => {
    const colors = [
      'text-primary bg-primary/10',
      'text-blue-500 bg-blue-500/10',
      'text-purple-500 bg-purple-500/10',
      'text-orange-500 bg-orange-500/10'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Main Pipeline Zone - Center */}
      <div className="flex-1 relative bg-muted/5 bg-grid-pattern p-8 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-12 py-10">
          <div className="flex flex-col items-center mb-12">
            <h1 className="text-2xl font-bold text-foreground mb-2">Editor Pipeline</h1>
            {currentPipeline ? (
              <p className="text-sm text-primary font-medium">Pipeline ID: {currentPipeline.pipeline_id}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Визуализация текущего процесса автоматизации</p>
            )}
          </div>

          {currentPipeline ? (
            <div className="flex flex-wrap items-center justify-center gap-y-12 gap-x-4 px-4">
              {currentPipeline.nodes.map((node, index) => (
                <React.Fragment key={node.step}>
                  <Card className="relative z-10 w-64 p-4 border-border hover:border-primary/40 transition-all bg-card shadow-lg flex flex-col items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", getIconColor(index))}>
                      {getNodeIcon(index)}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground line-clamp-1">{node.name}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{node.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-center mt-2">
                      {node.endpoints.map((ep, idx) => (
                        <Badge key={idx} variant="outline" className="text-[9px] py-0 border-border bg-muted/30">
                          {ep.name}
                        </Badge>
                      ))}
                    </div>
                  </Card>

                  {/* Connection arrow if not last node */}
                  {index < currentPipeline.nodes.length - 1 && (
                    <div className="flex items-center justify-center text-muted-foreground/30">
                      <ArrowRight className="h-6 w-6" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
              <Box className="h-16 w-16 mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">Опишите задачу в чате,</p>
              <p className="text-sm">чтобы ИИ собрал пайплайн</p>
            </div>
          )}

          {currentPipeline && (
            <Card className="mt-20 p-6 bg-primary/5 border-dashed border-primary/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Пайплайн готов</p>
                  <p className="text-sm text-muted-foreground">Все модули связаны и готовы к запуску</p>
                </div>
              </div>
              <Button className="gap-2">
                <Play className="h-4 w-4" /> Запустить поток
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Right Sidebar - AI Chat */}
      <SynthesisChat
        className="w-80"
        initialMessage={initialMessage}
        initialDialogId={dialogId}
      />
    </div>
  );
};

export default Pipelines;
