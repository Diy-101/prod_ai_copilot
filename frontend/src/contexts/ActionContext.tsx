import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { Action, Capability } from '@/types/action';

interface ActionContextType {
  actions: Action[];
  capabilities: Capability[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredActions: Action[];
  addActions: (newActions: Action[]) => void;
  addCapabilities: (newCapabilities: Capability[]) => void;
  removeAction: (id: string) => void;
  setActions: (actions: Action[]) => void;
  setCapabilities: (capabilities: Capability[]) => void;
}

const ActionContext = createContext<ActionContextType | undefined>(undefined);

export const ActionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [actions, setActions] = useState<Action[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredActions = useMemo(() => {
    return actions.filter((action) =>
      action.path?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (action.tags && action.tags[0]?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      action.summary?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [actions, searchTerm]);

  const addActions = useCallback((newActions: Action[]) => {
    setActions(prev => [...newActions, ...prev]);
  }, []);

  const addCapabilities = useCallback((newCapabilities: Capability[]) => {
    setCapabilities(prev => [...newCapabilities, ...prev]);
  }, []);

  const removeAction = useCallback((id: string) => {
    setActions(prev => prev.filter(a => a.id !== id));
  }, []);

  return (
    <ActionContext.Provider value={{
      actions,
      capabilities,
      searchTerm,
      setSearchTerm,
      filteredActions,
      addActions,
      addCapabilities,
      removeAction,
      setActions,
      setCapabilities
    }}>
      {children}
    </ActionContext.Provider>
  );
};

export const useActionsContext = () => {
  const context = useContext(ActionContext);
  if (context === undefined) {
    throw new Error('useActionsContext must be used within an ActionProvider');
  }
  return context;
};
