import React from "react";

export const CanvasInfoOverlay: React.FC = () => (
  <div className="absolute bottom-4 left-4 bg-primary/90 px-4 py-2 rounded-lg shadow-lg text-[10px] text-primary-foreground font-semibold border border-primary/20 backdrop-blur-sm">
    DRAG NODES TO BUILD | JOIN PORTS TO LINK
  </div>
);

export default CanvasInfoOverlay;
