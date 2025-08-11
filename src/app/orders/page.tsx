import { Button } from "@/components/ui/button";
import { PlusCircle, FileUp } from "lucide-react";
import OrdersTable from "@/components/orders/orders-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ActiveOrdersPage() {
    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-headline font-bold tracking-tight">
                    Órdenes de Trabajo
                </h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <FileUp className="mr-2 h-4 w-4" />
                        Exportar a Excel
                    </Button>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nueva OT
                    </Button>
                </div>
            </div>
            <Tabs defaultValue="todos">
              <TabsList>
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="servicios">Servicios (OS)</TabsTrigger>
                <TabsTrigger value="proyectos">Proyectos (OT)</TabsTrigger>
                <TabsTrigger value="mantenciones">Mantenciones (OM)</TabsTrigger>
                <TabsTrigger value="otros">Otros (OTR)</TabsTrigger>
              </TabsList>
              <TabsContent value="todos">
                <OrdersTable />
              </TabsContent>
              <TabsContent value="servicios">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8 text-center mt-4">
                  <p className="text-muted-foreground">No hay órdenes de servicio para mostrar.</p>
                </div>
              </TabsContent>
              <TabsContent value="proyectos">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8 text-center mt-4">
                  <p className="text-muted-foreground">No hay órdenes de proyecto para mostrar.</p>
                </div>
              </TabsContent>
              <TabsContent value="mantenciones">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8 text-center mt-4">
                  <p className="text-muted-foreground">No hay órdenes de mantención para mostrar.</p>
                </div>
              </TabsContent>
              <TabsContent value="otros">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8 text-center mt-4">
                  <p className="text-muted-foreground">No hay otras órdenes de trabajo para mostrar.</p>
                </div>
              </TabsContent>
            </Tabs>
        </div>
    );
}