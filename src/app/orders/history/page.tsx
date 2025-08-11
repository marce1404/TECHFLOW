import { historicalWorkOrders } from "@/lib/placeholder-data";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HistoryPage() {
    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-3xl font-headline font-bold tracking-tight">
                Historial de Órdenes de Trabajo
            </h1>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">OTs Cerradas</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>OT Nº</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Servicio</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Encargado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {historicalWorkOrders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/orders/${order.id}/edit`} className="text-primary hover:underline">
                                            {order.ot_number}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{order.client}</TableCell>
                                    <TableCell>{order.service}</TableCell>
                                    <TableCell>
                                        <Badge variant="default">
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{order.assigned}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
