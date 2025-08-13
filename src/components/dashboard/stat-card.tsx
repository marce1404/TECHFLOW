import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import type { StatCardData } from '@/lib/types';

export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: StatCardData) {
  return (
    <Card className="shadow-none border-none bg-transparent">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
        <CardTitle className="text-xs font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <div className="text-lg font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
