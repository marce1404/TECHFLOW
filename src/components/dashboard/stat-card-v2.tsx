
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { StatusChartData } from "@/lib/types";
import StatsDonutChart from "./stats-donut-chart";

interface StatCardV2Props {
  title: string;
  total: number;
  data: StatusChartData[];
}

export default function StatCardV2({ title, total, data }: StatCardV2Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Total de OTs: {total}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center pb-6">
        {data.length > 0 ? (
          <StatsDonutChart data={data} />
        ) : (
          <div className="flex h-[160px] w-full items-center justify-center text-sm text-muted-foreground">
            No hay datos para mostrar
          </div>
        )}
      </CardContent>
    </Card>
  );
}
