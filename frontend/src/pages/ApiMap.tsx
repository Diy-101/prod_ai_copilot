import React, { useMemo } from 'react';
import ReactFlow, {
  Controls,
  Node,
  Edge,
  Handle,
  Position,
  NodeProps
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useActionsContext } from '@/contexts/ActionContext';

/**
 * Custom components for nodes to control handle visibility
 */

// Central API Card
const ApiCentralNode = ({ data }: NodeProps) => (
  <div className="px-6 py-4 bg-blue-600 text-white rounded-xl shadow-[0_10px_25px_-5px_rgba(37,99,235,0.5)] font-bold text-sm text-center border-none min-w-[180px] relative">
    {data.label}
    {/* Only Source handle, and it's hidden to remove the "dots" as requested */}
    <Handle 
      type="source" 
      position={Position.Bottom} 
      className="w-0 h-0 border-none !bg-transparent opacity-0 pointer-events-none" 
    />
  </div>
);

// Action Library Card
const ApiActionNode = ({ data }: NodeProps) => (
  <div 
    className="px-4 py-2 text-white rounded-lg shadow-md font-medium text-[11px] text-center border-none min-w-[140px] relative"
    style={{ 
      background: data.color,
      boxShadow: `0 4px 6px -1px ${data.color}40`
    }}
  >
    {data.label}
    {/* Only Target handle, and it's hidden to remove the "dots" as requested */}
    <Handle 
      type="target" 
      position={Position.Top} 
      className="w-0 h-0 border-none !bg-transparent opacity-0 pointer-events-none" 
    />
  </div>
);

const nodeTypes = {
  api: ApiCentralNode,
  action: ApiActionNode
};

const ApiMap: React.FC = () => {
  const { actions } = useActionsContext();

  // Define nodes and edges based on actual actions or mock if empty
  const graphData = useMemo(() => {
    const centralNodeId = 'central';

    // Central Node: OpenAPI Specification
    const centralNode: Node = {
      id: centralNodeId,
      type: 'api', // Custom type
      data: { label: 'OpenAPI Specification' },
      position: { x: 400, y: 300 },
      // Style is now mostly in the component
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
        type: 'action', // Custom type
        data: { label, color },
        position: {
          x: centralNode.position.x + radius * Math.cos(angle) + 40,
          y: centralNode.position.y + radius * Math.sin(angle) + 10
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

      <div className="flex-1 relative bg-grid-pattern overflow-hidden">
        <ReactFlow
          nodes={graphData.nodes}
          edges={graphData.edges}
          nodeTypes={nodeTypes}
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
