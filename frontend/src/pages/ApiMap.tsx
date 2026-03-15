import React, { useMemo } from 'react';
import ReactFlow, {
  Controls,
  Node,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useActionsContext } from '@/contexts/ActionContext';

const ApiMap: React.FC = () => {
  const { actions } = useActionsContext();

  // Define nodes and edges based on actual actions or mock if empty
  const graphData = useMemo(() => {
    const centralNodeId = 'central';

    // Central Node: OpenAPI Specification
    const centralNode: Node = {
      id: centralNodeId,
      data: { label: 'OpenAPI Specification' },
      position: { x: 400, y: 300 },
      style: {
        background: '#3b82f6',
        color: '#fff',
        borderRadius: '12px',
        width: 180,
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '14px',
        boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)',
        border: 'none',
        zIndex: 10
      },
    };

    // If no real actions, use mock actions
    const displayActions = actions.length > 0
      ? actions.slice(0, 15) // Limit to 15 for visual clarity
      : [
        { id: 'm1', path: '/users', method: 'GET' },
        { id: 'm2', path: '/users', method: 'POST' },
        { id: 'm3', path: '/orders', method: 'GET' },
        { id: 'm4', path: '/payments', method: 'POST' },
        { id: 'm5', path: '/inventory', method: 'GET' },
        { id: 'm6', path: '/analytics', method: 'GET' },
        { id: 'm7', path: '/health', method: 'GET' },
      ];

    const actionNodes: Node[] = displayActions.map((action: any, index: number) => {
      const angle = (index / displayActions.length) * 2 * Math.PI;
      const radius = 280;

      const label = action.path
        ? `${action.method || 'GET'} ${action.path}`
        : `Action ${index + 1}`;

      const isPost = action.method === 'POST';
      const isDelete = action.method === 'DELETE';
      const color = isPost ? '#10b981' : isDelete ? '#ef4444' : '#6366f1';

      return {
        id: `action-${index}`,
        data: { label },
        position: {
          x: centralNode.position.x + radius * Math.cos(angle) + 40,
          y: centralNode.position.y + radius * Math.sin(angle) + 10
        },
        style: {
          background: color,
          color: '#fff',
          borderRadius: '8px',
          width: 140,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 500,
          border: 'none',
          boxShadow: `0 4px 6px -1px ${color}40`,
          cursor: 'pointer'
        },
      };
    });

    const edges: Edge[] = actionNodes.map((node) => ({
      id: `edge-${node.id}`,
      source: centralNodeId,
      target: node.id,
      animated: true,
      style: { stroke: '#94a3b8', strokeWidth: 1.5, opacity: 0.6 }
    }));

    return {
      nodes: [centralNode, ...actionNodes],
      edges
    };
  }, [actions]);

  return (
    <div className="h-full w-full bg-background flex flex-col">
      <div className="p-6 border-b border-border bg-card/50 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Knowledge Map</h1>
          <p className="text-sm text-muted-foreground">
            {actions.length > 0
              ? `Визуализация ${actions.length} экшенов из вашего файла спецификации`
              : 'Визуализация структуры типичного OpenAPI и его экшенов (Демо)'}
          </p>
        </div>
      </div>

      <div className="flex-1 relative bg-grid-pattern">
        <ReactFlow
          nodes={graphData.nodes}
          edges={graphData.edges}
          fitView
          nodesConnectable={false}
          nodesDraggable={true}
          elementsSelectable={true}
          minZoom={0.2}
          maxZoom={1.5}
        >
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};

export default ApiMap;
