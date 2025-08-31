
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { MixerHorizontalIcon, CalendarIcon } from '@radix-ui/react-icons';
import { useWorkOrders } from '@/context/work-orders-context';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import type { WorkOrder } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export type Filters = {
  search: string;
  client: string;
  service: string;
  technician: string;
  supervisor: string;
  priority: WorkOrder['priority'] | '';
  dateRange: DateRange;
};

interface AdvancedFiltersProps {
  onFilterChange: (filters: Filters) => void;
}

export default function AdvancedFilters({ onFilterChange }: AdvancedFiltersProps) {
  const { services, collaborators, activeWorkOrders, historicalWorkOrders } = useWorkOrders();
  const allOrders = [...activeWorkOrders, ...historicalWorkOrders];
  
  const [filters, setFilters] = React.useState<Filters>({
    search: '',
    client: '',
    service: '',
    technician: '',
    supervisor: '',
    priority: '',
    dateRange: { from: undefined, to: undefined },
  });

  const handleInputChange = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  React.useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const clearFilters = () => {
    setFilters({
      search: '',
      client: '',
      service: '',
      technician: '',
      supervisor: '',
      priority: '',
      dateRange: { from: undefined, to: undefined },
    });
  };

  const clients = React.useMemo(() => Array.from(new Set(allOrders.map(o => o.client))).sort(), [allOrders]);
  const technicians = React.useMemo(() => collaborators.filter(c => c.role === 'Técnico'), [collaborators]);
  const supervisors = React.useMemo(() => collaborators.filter(c => ['Supervisor', 'Coordinador', 'Jefe de Proyecto', 'Encargado'].includes(c.role)), [collaborators]);
  const priorities: WorkOrder['priority'][] = ['Baja', 'Media', 'Alta'];

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          placeholder="Buscar por Nº OT, descripción..."
          value={filters.search}
          onChange={(e) => handleInputChange('search', e.target.value)}
        />
        <Select value={filters.client} onValueChange={(value) => handleInputChange('client', value)}>
          <SelectTrigger><SelectValue placeholder="Filtrar por cliente..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los clientes</SelectItem>
            {clients.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.service} onValueChange={(value) => handleInputChange('service', value)}>
          <SelectTrigger><SelectValue placeholder="Filtrar por servicio..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los servicios</SelectItem>
            {services.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
         <Popover>
            <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !filters.dateRange.from && "text-muted-foreground")}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.from ? (
                        filters.dateRange.to ? (
                        <>
                            {format(filters.dateRange.from, "dd/MM/yy", {locale: es})} - {format(filters.dateRange.to, "dd/MM/yy", {locale: es})}
                        </>
                        ) : (
                        format(filters.dateRange.from, "dd/MM/yy", {locale: es})
                        )
                    ) : (
                        <span>Filtrar por fecha...</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={filters.dateRange.from}
                    selected={filters.dateRange}
                    onSelect={(range) => handleInputChange('dateRange', range || {from: undefined, to: undefined})}
                    numberOfMonths={2}
                    locale={es}
                />
            </PopoverContent>
        </Popover>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select value={filters.technician} onValueChange={(value) => handleInputChange('technician', value)}>
          <SelectTrigger><SelectValue placeholder="Filtrar por técnico..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los técnicos</SelectItem>
            {technicians.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.supervisor} onValueChange={(value) => handleInputChange('supervisor', value)}>
          <SelectTrigger><SelectValue placeholder="Filtrar por encargado..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los encargados</SelectItem>
            {supervisors.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.priority} onValueChange={(value) => handleInputChange('priority', value as WorkOrder['priority'])}>
          <SelectTrigger><SelectValue placeholder="Filtrar por prioridad..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las prioridades</SelectItem>
            {priorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="ghost" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          Limpiar Filtros
        </Button>
      </div>
    </div>
  );
}
