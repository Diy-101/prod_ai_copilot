import React from "react";

interface Flow {
  id: string;
  name: string;
}

interface FlowTabsProps {
  flows: Flow[];
  activeFlowId: string;
  onSelectFlow: (flowId: string) => void;
  onAddFlow: () => void;
  onDeleteFlow: (flowId: string) => void;
  onRenameFlow: (flowId: string, name: string) => void;
}

export const FlowTabs: React.FC<FlowTabsProps> = ({
  flows,
  activeFlowId,
  onSelectFlow,
  onAddFlow,
  onDeleteFlow,
  onRenameFlow,
}) => (
  <div className="flex items-center gap-2 p-2 bg-gray-100 border-b">
    {flows.map((flow) => (
      <div
        key={flow.id}
        className={`flex items-center gap-1 px-3 py-1 rounded cursor-pointer ${
          activeFlowId === flow.id
            ? "bg-white border border-green-400 font-bold"
            : "hover:bg-gray-200"
        }`}
        onClick={() => onSelectFlow(flow.id)}
      >
        <span
          className="font-bold w-20 truncate cursor-default"
          title={flow.name}
        >
          {flow.name}
        </span>
        {flows.length > 1 && (
          <button
            className="text-red-400 ml-1"
            title="Удалить поток"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFlow(flow.id);
            }}
          >
            ×
          </button>
        )}
      </div>
    ))}
    <button
      className="ml-2 px-2 py-1 bg-green-200 rounded text-green-900 font-bold"
      onClick={onAddFlow}
    >
      + Новый поток
    </button>
  </div>
);

export default FlowTabs;
