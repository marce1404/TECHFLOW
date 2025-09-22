
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from '@radix-ui/react-icons';
import { useWorkOrders } from '@/context/work-orders-context';
import { DateRange } from 'react-day-picker';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { X, Plus } from 'lucide-react';
import type { WorkOrder } from '@/lib/types';
import { MultiSelect } from '../ui/multi-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

type FilterType = 'clients' | 'services' | 'technicians' | 'supervisors' | 'priorities' | 'statuses' | 'invoicedStatus';

export interface ActiveFilter {
  type: FilterType;
  values: string[];
}

const filterOptions: { value: FilterType, label: string }[] = [
    { value: 'clients', label: 'Cliente' },
    { value: 'services', label: 'Servicio' },
    { value: 'technicians', label: 'Técnico' },
    { value: 'supervisors', label: 'Encargado' },
    { value: 'priorities', label: 'Prioridad' },
    { value: 'statuses', label: 'Estado' },
    { value: 'invoicedStatus', label: 'Estado de Factura' },
];

interface AdvancedFiltersProps {
    dateRange: DateRange | undefined;
    onDateRangeChange: (date: DateRange | undefined) => void;
    activeFilters: ActiveFilter[];
    onActiveFiltersChange: (filters: ActiveFilter[]) => void;
}


export default function AdvancedFilters({ dateRange, onDateRangeChange, activeFilters, onActiveFiltersChange }: AdvancedFiltersProps) {
  const { services, collaborators, workOrders, otStatuses } = useWorkOrders();
  const [month, setMonth] = React.useState<Date | undefined>();

  const clientOptions = React.useMemo(() => Array.from(new Set(workOrders.map(o => o.client).filter(Boolean))).sort().map(c => ({ value: c, label: c })), [workOrders]);
  const serviceOptions = React.useMemo(() => services.map(s => ({ value: s.name, label: s.name })), [services]);
  const technicianOptions = React.useMemo(() => collaborators.filter(c => c.role === 'Técnico').map(t => ({ value: t.name, label: t.name })), [collaborators]);
  const supervisorOptions = React.useMemo(() => collaborators.filter(c => ['Supervisor', 'Coordinador', 'Jefe de Proyecto', 'Encargado'].includes(c.role)).map(s => ({ value: s.name, label: s.name })), [collaborators]);
  const priorityOptions: { value: WorkOrder['priority'], label: string }[] = [{value: 'Baja', label: 'Baja'}, {value: 'Media', label: 'Media'}, {value: 'Alta', label: 'Alta'}];
  const statusOptions = React.useMemo(() => otStatuses.map(s => ({ value: s.name, label: s.name })), [otStatuses]);
  const invoicedStatusOptions = [
    { value: 'invoiced', label: 'Facturadas' },
    { value: 'not_invoiced', label: 'Por Facturar' },
  ];

  const getOptionsForType = (type: FilterType) => {
    switch (type) {
        case 'clients': return clientOptions;
        case 'services': return serviceOptions;
        case 'technicians': return technicianOptions;
        case 'supervisors': return supervisorOptions;
        case 'priorities': return priorityOptions;
        case 'statuses': return statusOptions;
        case 'invoicedStatus': return invoicedStatusOptions;
    }
  }

  const getLabelForType = (type: FilterType) => {
    return filterOptions.find(f => f.value === type)?.label || 'Filtro';
  };
  
  const addFilter = (type: FilterType) => {
    if (!activeFilters.some(f => f.type === type)) {
        onActiveFiltersChange([...activeFilters, { type, values: [] }]);
    }
  };

  const removeFilter = (type: FilterType) => {
    onActiveFiltersChange(activeFilters.filter(f => f.type !== type));
  };
  
  const updateFilterValues = (type: FilterType, newValues: string[]) => {
    onActiveFiltersChange(activeFilters.map(f => f.type === type ? { ...f, values: newValues } : f));
  };
  
  const handleMonthSelect = (selectedMonth: Date | undefined) => {
    setMonth(selectedMonth);
    if (selectedMonth) {
      const start = startOfMonth(selectedMonth);
      const end = endOfMonth(selectedMonth);
      onDateRangeChange({ from: start, to: end });
    } else {
      onDateRangeChange(undefined);
    }
  };


  const availableFilterOptions = filterOptions.filter(opt => !activeFilters.some(f => f.type === opt.value));

  const clearAll = () => {
    handleMonthSelect(undefined);
    onActiveFiltersChange([]);
  };

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Filtrar por Mes</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !month && "text-muted-foreground")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {month ? (
                                <span className="capitalize">{format(month, "MMMM yyyy", {locale: es})}</span>
                            ) : (
                                <span>Seleccionar mes...</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="single"
                            month={month}
                            onMonthChange={handleMonthSelect}
                            captionLayout="dropdown-buttons"
                            fromYear={2020}
                            toYear={new Date().getFullYear() + 2}
                            locale={es}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </div>

        <div className="space-y-3">
             {activeFilters.map((filter) => (
                <div key={filter.type} className="flex items-end gap-2">
                    <div className="flex-1 space-y-2">
                         <Label>{getLabelForType(filter.type)}</Label>
                         {filter.type === 'invoicedStatus' ? (
                            <Select
                                value={filter.values[0] || ''}
                                onValueChange={(value) => updateFilterValues(filter.type, value ? [value] : [])}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar estado..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {getOptionsForType(filter.type).map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                         ) : (
                            <MultiSelect
                                options={getOptionsForType(filter.type)}
                                selected={filter.values}
                                onChange={(newValues) => updateFilterValues(filter.type, newValues)}
                                placeholder={`Seleccionar ${getLabelForType(filter.type).toLowerCase()}...`}
                            />
                         )}
                    </div>
                     <Button variant="ghost" size="icon" onClick={() => removeFilter(filter.type)} className="mb-1">
                        <X className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
        </div>
      
      <div className="flex justify-between items-center pt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={availableFilterOptions.length === 0}>
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir Filtro
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {availableFilterOptions.map(opt => (
                    <DropdownMenuItem key={opt.value} onSelect={() => addFilter(opt.value)}>
                        {opt.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" onClick={clearAll} size="sm">
            <X className="mr-2 h-4 w-4" />
            Limpiar Todos los Filtros
          </Button>
      </div>
    </div>
  );
}
