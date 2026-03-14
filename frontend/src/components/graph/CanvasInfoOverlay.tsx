import React from "react";

export const CanvasInfoOverlay: React.FC = () => (
  <div className="absolute bottom-4 left-4 bg-green-600 px-4 py-2 rounded-lg shadow text-xs text-white font-semibold border border-green-800">
    Клик - выбор | Перетаскивание - перемещение
  </div>
);

export default CanvasInfoOverlay;
