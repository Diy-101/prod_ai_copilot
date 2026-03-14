import React from "react";
import { Database } from "lucide-react";
import clsx from "clsx";

export const SystemDatabaseNode: React.FC<{
  name?: string;
  health?: number;
}> = ({ name, health }) => (
  <div className="flex flex-col items-center justify-center w-full bg-blue-50 border-2 border-blue-300 rounded-lg shadow p-1 min-w-[120px] max-w-[150px] py-2">
    <Database className="h-7 w-7 text-blue-600 mb-1" />
    <span className="font-bold text-blue-900 text-sm mb-1">{name || "БД"}</span>
    {typeof health === "number" && (
      <div className="mt-1 w-full flex items-center gap-1">
        <div className="flex-1 bg-gray-300 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              health > 80
                ? "bg-green-500"
                : health > 60
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${health}%` }}
          />
        </div>
        <span className="text-[11px] text-gray-700 font-semibold ml-1">
          {health}%
        </span>
      </div>
    )}
  </div>
);
