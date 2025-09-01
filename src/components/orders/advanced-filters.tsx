
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from '@radix-ui/react-icons';
import { useWorkOrders } from '@/context/work-orders-context';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import type { WorkOrder } from '@/lib/types';
import { MultiSelect } from '../ui/multi-select';

export type Filters = {
  search: string;
  clients: string[];
  services: string[];
  technicians: string[];
  supervisors: string[];
  priorities: string[];
  statuses: string[];
  dateRange: DateRange;
};

interface AdvancedFiltersProps {
  onFilterChange: (filters: Omit<Filters, 'search'>) => void;
  isHistory?: boolean;
}

export default function AdvancedFilters({ onFilterChange, isHistory = false }: AdvancedFiltersProps) {
  const { services, collaborators, activeWorkOrders, historicalWorkOrders, otStatuses } = useWorkOrders();
  const allOrders = [...activeWorkOrders, ...historicalWorkOrders];
  
  const [filters, setFilters] = React.useState<Omit<Filters, 'search'>>({
    clients: [],
    services: [],
    technicians: [],
    supervisors: [],
    priorities: [],
    statuses: [],
    dateRange: { from: undefined, to: undefined },
  });

  const handleMultiSelectChange = (key: keyof Omit<Filters, 'search' | 'dateRange'>, value: string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (value: DateRange | undefined) => {
    setFilters(prev => ({ ...prev, dateRange: value || { from: undefined, to: undefined } }));
  };

  React.useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const clearFilters = () => {
    setFilters({
      clients: [],
      services: [],
      technicians: [],
      supervisors: [],
      priorities: [],
      statuses: [],
      dateRange: { from: undefined, to: undefined },
    });
  };

  const clientOptions = React.useMemo(() => Array.from(new Set(allOrders.map(o => o.client).filter(Boolean))).sort().map(c => ({ value: c, label: c })), [allOrders]);
  const serviceOptions = React.useMemo(() => services.map(s => ({ value: s.name, label: s.name })), [services]);
  const technicianOptions = React.useMemo(() => collaborators.filter(c => c.role === 'Técnico').map(t => ({ value: t.name, label: t.name })), [collaborators]);
  const supervisorOptions = React.useMemo(() => collaborators.filter(c => ['Supervisor', 'Coordinador', 'Jefe de Proyecto', 'Encargado'].includes(c.role)).map(s => ({ value: s.name, label: s.name })), [collaborators]);
  const priorityOptions: { value: WorkOrder['priority'], label: string }[] = [{value: 'Baja', label: 'Baja'}, {value: 'Media', label: 'Media'}, {value: 'Alta', label: 'Alta'}];
  const statusOptions = React.useMemo(() => otStatuses.map(s => ({ value: s.name, label: s.name })), [otStatuses]);


  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    onSelect={handleDateChange}
                    numberOfMonths={2}
                    locale={es}
                />
            </PopoverContent>
        </Popover>
         <MultiSelect
          options={clientOptions}
          selected={filters.clients}
          onChange={(value) => handleMultiSelectChange('clients', value)}
          placeholder="Filtrar por cliente..."
        />
        <MultiSelect
          options={serviceOptions}
          selected={filters.services}
          onChange={(value) => handleMultiSelectChange('services', value)}
          placeholder="Filtrar por servicio..."
        />
        <MultiSelect
          options={technicianOptions}
          selected={filters.technicians}
          onChange={(value) => handleMultiSelectChange('technicians', value)}
          placeholder="Filtrar por técnico..."
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MultiSelect
          options={supervisorOptions}
          selected={filters.supervisors}
          onChange={(value) => handleMultiSelectChange('supervisors', value)}
          placeholder="Filtrar por encargado..."
        />
         <MultiSelect
          options={priorityOptions}
          selected={filters.priorities}
          onChange={(value) => handleMultiSelectChange('priorities', value)}
          placeholder="Filtrar por prioridad..."
        />
        <MultiSelect
          options={statusOptions}
          selected={filters.statuses}
          onChange={(value) => handleMultiSelectChange('statuses', value)}
          placeholder="Filtrar por estado..."
        />
         <Button variant="ghost" onClick={clearFilters} className="justify-self-end">
            <X className="mr-2 h-4 w-4" />
            Limpiar Filtros Avanzados
          </Button>
      </div>
    </div>
  );
}
