import { 
  Zap, 
  Plus, 
  Search, 
  Link2, 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useActionsContext } from '@/contexts/ActionContext';

const Capabilities: React.FC = () => {
  const { filteredCapabilities, searchTerm, setSearchTerm } = useActionsContext();

  return (
    <div className="flex h-full flex-col px-4 sm:px-6 py-6 sm:py-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Capabilities Library
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Бизнес-навыки, созданные путем объединения нескольких API Actions. Обучены для понимания вашим ИИ.
          </p>
        </div>
      </div>

      {/* Search/Filters */}
      <div className="mb-8">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Поиск по названию..." 
            className="pl-10 w-full bg-card border-border focus-visible:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid Section - Added flex-1 and min-h-0 for proper scrolling behavior */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-10">
        {filteredCapabilities.map((cap) => (
          <Card key={cap.id} className="bg-card border-border hover:border-primary/50 transition-all group overflow-hidden flex flex-col h-full min-h-[200px]">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between">
                <div className="bg-primary/10 p-1.5 rounded-lg mb-2 shrink-0">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
              </div>
              <CardTitle className="text-base text-foreground group-hover:text-primary transition-colors">
                {cap.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1">
              <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-4">
                {cap.description}
              </p>
              
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Link2 className="h-3 w-3" />
                <span>Содержит 1 Actions</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Create Placeholder Card */}
        <button className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-4 hover:border-primary/30 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary group min-h-[200px] h-full">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/10">
            <Plus className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium">Build New Capability</span>
        </button>
        </div>
      </div>
    </div>
  );
};

export default Capabilities;
