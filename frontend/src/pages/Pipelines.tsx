import React from 'react';
import { useLocation } from 'react-router-dom';
import { SynthesisChat } from '@/components/shared/SynthesisChat';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Activity,
  Play,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { motion, AnimatePresence } from 'framer-motion';
import { PipelineData, PipelineEdge, PipelineNode } from '@/types/pipeline';
import { cn } from '@/lib/utils';
import {
  ExecutionRunDetailResponse,
  ExecutionRunStatus,
  ExecutionStepRunResponse,
  ExecutionStepStatus,
  getExecution,
  runPipeline,
} from '@/api/executions';
import { toast } from 'sonner';

type PositionedNode = {
  node: PipelineNode;
  x: number;
  y: number;
};

type DrawableEdge = {
  edge: PipelineEdge;
  path: string;
  labelX: number;
  labelY: number;
};

const CARD_WIDTH = 256;
const CARD_HEIGHT = 90; // Significantly smaller base height
const COLUMN_GAP = 120;
const ROW_GAP = 64;
const PADDING_X = 48;
const PADDING_Y = 32;

const buildGraphLayout = (pipeline: PipelineData) => {
  const nodeByStep = new Map<number, PipelineNode>();
  const incoming = new Map<number, number>();
  const outgoing = new Map<number, number[]>();

  pipeline.nodes.forEach((node) => {
    nodeByStep.set(node.step, node);
    incoming.set(node.step, 0);
    outgoing.set(node.step, []);
  });

  pipeline.edges.forEach((edge) => {
    if (!nodeByStep.has(edge.from_step) || !nodeByStep.has(edge.to_step)) {
      return;
    }
    outgoing.get(edge.from_step)?.push(edge.to_step);
    incoming.set(edge.to_step, (incoming.get(edge.to_step) || 0) + 1);
  });

  const roots = pipeline.nodes
    .filter((node) => (incoming.get(node.step) || 0) === 0)
    .sort((left, right) => left.step - right.step);
  const levels = new Map<number, number>();
  const queue = [...roots];

  roots.forEach((node) => levels.set(node.step, 0));

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    const currentLevel = levels.get(current.step) || 0;
    const children = outgoing.get(current.step) || [];
    children.forEach((childStep) => {
      const nextLevel = currentLevel + 1;
      const previousLevel = levels.get(childStep);
      if (previousLevel === undefined || nextLevel > previousLevel) {
        levels.set(childStep, nextLevel);
      }
      const childNode = nodeByStep.get(childStep);
      if (childNode) {
        queue.push(childNode);
      }
    });
  }

  pipeline.nodes.forEach((node) => {
    if (!levels.has(node.step)) {
      levels.set(node.step, 0);
    }
  });

  const nodesByLevel = new Map<number, PipelineNode[]>();
  pipeline.nodes.forEach((node) => {
    const level = levels.get(node.step) || 0;
    const bucket = nodesByLevel.get(level) || [];
    bucket.push(node);
    nodesByLevel.set(level, bucket);
  });

  const levelEntries = [...nodesByLevel.entries()].sort((left, right) => left[0] - right[0]);
  levelEntries.forEach(([, nodes]) => nodes.sort((left, right) => left.step - right.step));

  const positionedNodes: PositionedNode[] = [];
  levelEntries.forEach(([level, nodes]) => {
    nodes.forEach((node, rowIndex) => {
      positionedNodes.push({
        node,
        x: PADDING_X + level * (CARD_WIDTH + COLUMN_GAP),
        y: PADDING_Y + rowIndex * (CARD_HEIGHT + ROW_GAP),
      });
    });
  });

  const positionByStep = new Map<number, PositionedNode>();
  positionedNodes.forEach((positionedNode) => {
    positionByStep.set(positionedNode.node.step, positionedNode);
  });

  const drawableEdges: DrawableEdge[] = pipeline.edges
    .map((edge) => {
      const from = positionByStep.get(edge.from_step);
      const to = positionByStep.get(edge.to_step);
      if (!from || !to) {
        return null;
      }

      const startX = from.x + CARD_WIDTH;
      const startY = from.y + CARD_HEIGHT / 2;
      const endX = to.x;
      const endY = to.y + CARD_HEIGHT / 2;
      const controlOffset = Math.max(48, (endX - startX) / 2);
      const path = [
        `M ${startX} ${startY}`,
        `C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`,
      ].join(' ');

      return {
        edge,
        path,
        labelX: startX + (endX - startX) / 2,
        labelY: startY + (endY - startY) / 2 - 12,
      };
    })
    .filter((edge): edge is DrawableEdge => edge !== null);

  const maxLevel = Math.max(...levelEntries.map(([level]) => level), 0);
  const maxRows = Math.max(...levelEntries.map(([, nodes]) => nodes.length), 1);

  return {
    positionedNodes,
    drawableEdges,
    width: PADDING_X * 2 + (maxLevel + 1) * CARD_WIDTH + maxLevel * COLUMN_GAP,
    height: PADDING_Y * 2 + maxRows * CARD_HEIGHT + Math.max(0, maxRows - 1) * ROW_GAP,
  };
};

const TERMINAL_RUN_STATUSES: ExecutionRunStatus[] = [
  'SUCCEEDED',
  'FAILED',
  'PARTIAL_FAILED',
];

const isTerminalRunStatus = (status: ExecutionRunStatus) =>
  TERMINAL_RUN_STATUSES.includes(status);

const getRunStatusMeta = (status: ExecutionRunStatus | null) => {
  if (status === 'SUCCEEDED') {
    return {
      label: 'SUCCEEDED',
      badgeClass: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700',
    };
  }
  if (status === 'FAILED') {
    return {
      label: 'FAILED',
      badgeClass: 'border-red-500/40 bg-red-500/10 text-red-700',
    };
  }
  if (status === 'PARTIAL_FAILED') {
    return {
      label: 'PARTIAL_FAILED',
      badgeClass: 'border-amber-500/40 bg-amber-500/10 text-amber-700',
    };
  }
  if (status === 'RUNNING') {
    return {
      label: 'RUNNING',
      badgeClass: 'border-blue-500/40 bg-blue-500/10 text-blue-700',
    };
  }
  if (status === 'QUEUED') {
    return {
      label: 'QUEUED',
      badgeClass: 'border-slate-500/40 bg-slate-500/10 text-slate-700',
    };
  }
  return {
    label: 'IDLE',
    badgeClass: 'border-border bg-muted text-muted-foreground',
  };
};

const getStepStatusMeta = (status: ExecutionStepStatus | undefined) => {
  if (status === 'SUCCEEDED') {
    return {
      label: 'SUCCEEDED',
      cardClass: 'border-emerald-500/40 bg-emerald-500/5',
      badgeClass: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700',
    };
  }
  if (status === 'FAILED') {
    return {
      label: 'FAILED',
      cardClass: 'border-red-500/40 bg-red-500/5',
      badgeClass: 'border-red-500/40 bg-red-500/10 text-red-700',
    };
  }
  if (status === 'RUNNING') {
    return {
      label: 'RUNNING',
      cardClass: 'border-blue-500/40 bg-blue-500/5 ring-1 ring-blue-500/20',
      badgeClass: 'border-blue-500/40 bg-blue-500/10 text-blue-700',
    };
  }
  if (status === 'SKIPPED') {
    return {
      label: 'SKIPPED',
      cardClass: 'border-amber-500/40 bg-amber-500/5',
      badgeClass: 'border-amber-500/40 bg-amber-500/10 text-amber-700',
    };
  }
  return {
    label: 'PENDING',
    cardClass: '',
    badgeClass: 'border-border bg-muted text-muted-foreground',
  };
};

export const Pipelines: React.FC = () => {
  const location = useLocation();
  const { currentPipeline } = usePipelineContext();
  const [expandedStep, setExpandedStep] = React.useState<number | null>(null);
  const [runInputs, setRunInputs] = React.useState<Record<string, string>>({});
  const [execution, setExecution] = React.useState<ExecutionRunDetailResponse | null>(
    null
  );
  const [activeRunId, setActiveRunId] = React.useState<string | null>(null);
  const [isRunStarting, setIsRunStarting] = React.useState(false);
  const pollingTimerRef = React.useRef<ReturnType<typeof window.setInterval> | null>(
    null
  );
  const isPollingRequestInFlightRef = React.useRef(false);
  const notifiedTerminalStatusRef = React.useRef<ExecutionRunStatus | null>(null);

  const initialMessage = location.state?.initialMessage;
  const dialogId = location.state?.dialogId;
  const pipelineId = currentPipeline?.pipeline_id || null;
  const requiredInputKeys = React.useMemo(() => {
    if (!currentPipeline) {
      return [];
    }
    const unique = new Set<string>();
    currentPipeline.nodes.forEach((node) => {
      node.external_inputs.forEach((name) => {
        if (typeof name === 'string' && name.trim()) {
          unique.add(name.trim());
        }
      });
    });
    return Array.from(unique).sort();
  }, [currentPipeline]);

  const graphLayout = currentPipeline && currentPipeline.nodes.length > 0
    ? buildGraphLayout(currentPipeline)
    : null;
  const stepRunsByStep = React.useMemo(() => {
    const byStep = new Map<number, ExecutionStepRunResponse>();
    execution?.steps.forEach((stepRun) => {
      byStep.set(stepRun.step, stepRun);
    });
    return byStep;
  }, [execution]);
  const runStatusMeta = getRunStatusMeta(execution?.status || null);
  const isExecutionInProgress = execution
    ? !isTerminalRunStatus(execution.status)
    : Boolean(activeRunId);

  const stopPollingExecution = React.useCallback(() => {
    if (pollingTimerRef.current !== null) {
      window.clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    isPollingRequestInFlightRef.current = false;
  }, []);

  const pollExecution = React.useCallback(
    async (runId: string, options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (isPollingRequestInFlightRef.current) {
        return;
      }
      isPollingRequestInFlightRef.current = true;

      try {
        const runDetail = await getExecution(runId);
        setExecution(runDetail);
        setActiveRunId(runId);

        if (!isTerminalRunStatus(runDetail.status)) {
          notifiedTerminalStatusRef.current = null;
          return;
        }

        stopPollingExecution();
        const isNewTerminalStatus = notifiedTerminalStatusRef.current !== runDetail.status;
        if (!silent && isNewTerminalStatus) {
          if (runDetail.status === 'SUCCEEDED') {
            toast.success('Пайплайн выполнен успешно');
          } else {
            toast.error(runDetail.error || 'Пайплайн завершился с ошибками');
          }
        }
        notifiedTerminalStatusRef.current = runDetail.status;
      } catch (error) {
        stopPollingExecution();
        if (!silent) {
          toast.error(
            error instanceof Error ? error.message : 'Не удалось получить статус выполнения'
          );
        }
      } finally {
        isPollingRequestInFlightRef.current = false;
      }
    },
    [stopPollingExecution]
  );

  const startPollingExecution = React.useCallback(
    (runId: string) => {
      stopPollingExecution();
      pollExecution(runId).catch(() => null);
      pollingTimerRef.current = window.setInterval(() => {
        pollExecution(runId).catch(() => null);
      }, 2000);
    },
    [pollExecution, stopPollingExecution]
  );

  const handleRunInputChange = React.useCallback(
    (key: string, value: string) => {
      setRunInputs((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const handleRunPipeline = React.useCallback(async () => {
    if (!pipelineId) {
      return;
    }

    const missingRequiredInputs = requiredInputKeys.filter((inputName) => {
      const value = runInputs[inputName];
      return typeof value !== 'string' || value.trim() === '';
    });

    if (missingRequiredInputs.length > 0) {
      toast.error(
        `Заполните обязательные поля: ${missingRequiredInputs.join(', ')}`
      );
      return;
    }

    const normalizedInputs: Record<string, string> = {};
    Object.entries(runInputs).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim() !== '') {
        normalizedInputs[key] = value.trim();
      }
    });

    try {
      setIsRunStarting(true);
      setExecution(null);
      notifiedTerminalStatusRef.current = null;
      const run = await runPipeline(pipelineId, {
        inputs: normalizedInputs,
      });
      setActiveRunId(run.run_id);
      toast.success('Запуск пайплайна начат');
      startPollingExecution(run.run_id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось запустить пайплайн');
    } finally {
      setIsRunStarting(false);
    }
  }, [pipelineId, requiredInputKeys, runInputs, startPollingExecution]);

  React.useEffect(() => {
    setExecution(null);
    setActiveRunId(null);
    notifiedTerminalStatusRef.current = null;
    stopPollingExecution();
  }, [pipelineId, stopPollingExecution]);

  React.useEffect(() => {
    setRunInputs((prev) => {
      const next: Record<string, string> = {};
      requiredInputKeys.forEach((key) => {
        next[key] = prev[key] || '';
      });
      return next;
    });
  }, [requiredInputKeys]);

  React.useEffect(() => {
    return () => {
      stopPollingExecution();
    };
  }, [stopPollingExecution]);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Main Pipeline Zone - Center */}
      <div className="flex-1 relative bg-muted/5 bg-grid-pattern p-8 overflow-auto">
        <div className="space-y-12 py-10 min-w-max">
          <div className="flex flex-col items-center mb-12">
            <h1 className="text-2xl font-bold text-foreground mb-2">Editor Pipeline</h1>
            <p className="text-sm text-muted-foreground">Визуализация текущего процесса автоматизации</p>
          </div>

          {graphLayout && currentPipeline ? (
            <div
              className="relative mx-auto"
              style={{
                width: graphLayout.width,
                height: graphLayout.height,
              }}
            >
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox={`0 0 ${graphLayout.width} ${graphLayout.height}`}
                fill="none"
              >
                {graphLayout.drawableEdges.map(({ edge, path, labelX, labelY }) => (
                  <g key={`${edge.from_step}-${edge.to_step}-${edge.type}`}>
                    <path
                      d={path}
                      className="stroke-primary/50"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle
                      cx={labelX}
                      cy={labelY + 12}
                      r="4"
                      className="fill-primary/80"
                    />
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[11px]"
                    >
                      {edge.type}
                    </text>
                  </g>
                ))}
              </svg>

              {graphLayout.positionedNodes.map(({ node, x, y }) => {
                const endpoint = node.endpoints[0];
                const isExpanded = expandedStep === node.step;
                const stepRun = stepRunsByStep.get(node.step);
                const stepStatusMeta = getStepStatusMeta(stepRun?.status);

                return (
                  <motion.div
                    key={node.step}
                    layout
                    initial={false}
                    animate={{ 
                      height: isExpanded ? 'auto' : CARD_HEIGHT,
                      zIndex: isExpanded ? 50 : 10
                    }}
                    className={cn(
                      "absolute border border-primary/20 bg-card shadow-lg rounded-xl overflow-hidden cursor-pointer transition-colors hover:border-primary/40",
                      stepStatusMeta.cardClass,
                      isExpanded ? "shadow-2xl ring-1 ring-primary/10" : "shadow-md"
                    )}
                    style={{
                      width: CARD_WIDTH,
                      left: x,
                      top: y,
                    }}
                    onClick={() => setExpandedStep(isExpanded ? null : node.step)}
                  >
                    <div className="p-4 flex flex-col h-full">
                      {/* Condensed Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary/60">
                            Step {node.step}
                          </p>
                          <h3 className={cn(
                            "mt-0.5 font-semibold text-foreground truncate transition-all",
                            isExpanded ? "text-base" : "text-sm"
                          )}>
                            {node.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!isExpanded && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "px-1.5 py-0 text-[10px]",
                                stepStatusMeta.badgeClass
                              )}
                            >
                              {stepStatusMeta.label}
                            </Badge>
                          )}
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>

                      {/* Expandable Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-4 space-y-4 pt-4 border-t border-border"
                          >
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {node.description || 'Описание шага не указано.'}
                            </p>

                            <div className="space-y-2 text-xs text-muted-foreground">
                              <div className="flex justify-between">
                                <span className="font-semibold text-foreground">Capability:</span>
                                <span className="text-right">{endpoint?.name || 'Не определено'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-semibold text-foreground">Inputs:</span>
                                <span className="text-right">
                                  {node.input_connected_from.length > 0 ? `Step ${node.input_connected_from.join(', ')}` : 'External'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-semibold text-foreground">Outputs:</span>
                                <span className="text-right">
                                  {node.output_connected_to.length > 0 ? `Step ${node.output_connected_to.join(', ')}` : 'Terminal'}
                                </span>
                              </div>
                              {stepRun && (
                                <>
                                  <div className="flex justify-between">
                                    <span className="font-semibold text-foreground">Status:</span>
                                    <span className="text-right">{stepRun.status}</span>
                                  </div>
                                  {typeof stepRun.duration_ms === 'number' && (
                                    <div className="flex justify-between">
                                      <span className="font-semibold text-foreground">Duration:</span>
                                      <span className="text-right">{stepRun.duration_ms} ms</span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            {node.external_inputs.length > 0 && (
                              <div className="pt-2">
                                <p className="text-[10px] font-semibold text-foreground mb-2 uppercase tracking-wider">Required Params:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {node.external_inputs.map((inputName) => (
                                    <Badge
                                      key={inputName}
                                      variant="outline"
                                      className="text-[10px] py-0 border-amber-500/30 bg-amber-500/5 text-amber-700"
                                    >
                                      {inputName}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {stepRun?.error && (
                              <div className="rounded-md border border-red-500/30 bg-red-500/5 p-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-red-700">
                                  Error
                                </p>
                                <p className="mt-1 text-xs text-red-700 break-words">{stepRun.error}</p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="mx-auto flex max-w-2xl items-center gap-4 border-dashed border-primary/20 bg-card p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Pipeline еще не построен</p>
                <p className="text-sm text-muted-foreground">
                  Отправьте сообщение в чат справа после импорта OpenAPI, и граф появится здесь.
                </p>
              </div>
            </Card>
          )}

          <Card className="mt-20 p-6 bg-primary/5 border-dashed border-primary/20 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Статус пайплайна</p>
                  <p className="text-sm text-muted-foreground">
                    {currentPipeline?.message_ru || 'Все модули в режиме ожидания запуска'}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={cn("text-xs", runStatusMeta.badgeClass)}>
                {runStatusMeta.label}
              </Badge>
            </div>

            {requiredInputKeys.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Входные параметры запуска
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {requiredInputKeys.map((inputName) => (
                    <div key={inputName} className="space-y-1">
                      <label className="text-xs font-medium text-foreground">{inputName}</label>
                      <Input
                        value={runInputs[inputName] || ''}
                        onChange={(event) =>
                          handleRunInputChange(inputName, event.target.value)
                        }
                        placeholder={`Введите ${inputName}`}
                        className="bg-background"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                {activeRunId ? `Run ID: ${activeRunId}` : 'Запусков в текущей сессии пока нет'}
              </div>
              <Button
                className="gap-2"
                disabled={
                  !pipelineId ||
                  isRunStarting ||
                  isExecutionInProgress
                }
                onClick={handleRunPipeline}
              >
                {isRunStarting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Запуск...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" /> Запустить поток
                  </>
                )}
              </Button>
            </div>

            {execution && (
              <div className="space-y-3 rounded-lg border border-border bg-background/70 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn("text-[11px]", runStatusMeta.badgeClass)}>
                    {execution.status}
                  </Badge>
                  {execution.error && (
                    <span className="text-xs text-red-700 break-words">{execution.error}</span>
                  )}
                </div>
                {execution.summary && (
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground md:grid-cols-4">
                    <div>
                      <p className="font-semibold text-foreground">Total</p>
                      <p>{String(execution.summary.total_steps ?? '-')}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Succeeded</p>
                      <p>{String(execution.summary.succeeded_steps ?? '-')}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Failed</p>
                      <p>{String(execution.summary.failed_steps ?? '-')}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Skipped</p>
                      <p>{String(execution.summary.skipped_steps ?? '-')}</p>
                    </div>
                  </div>
                )}
                {execution.steps.length > 0 && (
                  <div className="space-y-2">
                    {execution.steps
                      .slice()
                      .sort((left, right) => left.step - right.step)
                      .map((stepRun) => {
                        const meta = getStepStatusMeta(stepRun.status);
                        return (
                          <div
                            key={`${stepRun.step}-${stepRun.created_at}`}
                            className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">
                                Шаг {stepRun.step}: {stepRun.name || 'Без названия'}
                              </p>
                              {stepRun.error && (
                                <p className="mt-0.5 text-red-700 truncate">{stepRun.error}</p>
                              )}
                            </div>
                            <Badge variant="outline" className={cn("ml-2", meta.badgeClass)}>
                              {meta.label}
                            </Badge>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </Card>
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
