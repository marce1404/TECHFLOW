

'use client';
import HistoricalOrdersTable from "@/components/orders/historical-orders-table";
import { useWorkOrders } from "@/context/work-orders-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as React from "react";
import type { WorkOrder } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileUp, Loader2 } from "lucide-react";
import { exportOrdersToExcel } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";


export default function HistoryPage() {
    const { historicalWorkOrders, otCategories } = useWorkOrders();
    const { toast } = useToast();
    const [search, setSearch] = React.useState('');
    const [activeTab, setActiveTab] = React.useState('todos');
    const [isExporting, setIsExporting] = React.useState(false);


    const filterOrders = (categoryPrefix: string | null) => {
        setActiveTab(categoryPrefix || 'todos');
    }
    
    const filteredOrders = React.useMemo(() => {
        let orders = historicalWorkOrders;
        if (activeTab !== 'todos') {
            orders = orders.filter(order => order.ot_number.startsWith(activeTab));
        }
        if (search) {
            orders = orders.filter(order =>
                order.ot_number.toLowerCase().includes(search.toLowerCase()) ||
                order.description.toLowerCase().includes(search.toLowerCase()) ||
                order.client.toLowerCase().includes(search.toLowerCase()) ||
                order.service.toLowerCase().includes(search.toLowerCase())
            );
        }
        return orders;
    }, [historicalWorkOrders, activeTab, search]);


    const categories = [
        { id: "todos", value: "todos", label: "Todos", prefix: 'todos' },
        ...otCategories
            .map(cat => ({
                id: cat.id,
                value: cat.prefix,
                label: `${cat.name} (${cat.prefix})`,
                prefix: cat.prefix,
            }))
    ];

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const base64 = await exportOrdersToExcel(filteredOrders);
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'OT_Historial.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast({ title: "Exportación Exitosa", description: `${filteredOrders.length} órdenes han sido exportadas.` });
        } catch (error) {
            console.error("Error exporting to Excel: ", error);
            toast({ variant: "destructive", title: "Error de Exportación", description: "No se pudo generar el archivo de Excel." });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <Card>
                <CardContent className="p-4">
                    <Tabs value={activeTab} onValueChange={filterOrders}>
                         <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                            <ScrollArea className="w-full sm:w-auto">
                                <TabsList className="w-max">
                                    {categories.map(cat => (
                                        <TabsTrigger key={cat.id} value={cat.prefix}>{cat.label}</TabsTrigger>
                                    ))}
                                </TabsList>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                             <div className="flex w-full sm:w-auto items-center gap-2">
                                <Input
                                    placeholder="Buscar por ID, cliente, servicio..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full sm:max-w-sm"
                                />
                                <Button onClick={handleExport} disabled={isExporting}>
                                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                                    Exportar
                                </Button>
                            </div>
                        </div>
                        <TabsContent value={activeTab} className="mt-4">
                            <HistoricalOrdersTable orders={filteredOrders} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
