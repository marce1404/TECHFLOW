
'use client';

import * as React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AppUser } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '../ui/skeleton';

export default function UsersTable() {
    const [users, setUsers] = React.useState<AppUser[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
            const usersData = snapshot.docs.map(doc => doc.data() as AppUser);
            setUsers(usersData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-3 w-2/4" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-8 w-8" />
                    </div>
                ))}
            </div>
        )
    }

    const getStatusVariant = (status: AppUser['status']) => {
        return status === 'Activo' ? 'default' : 'outline';
    }

    const getRoleVariant = (role: AppUser['role']) => {
        switch (role) {
            case 'Admin': return 'destructive';
            case 'Supervisor': return 'secondary';
            default: return 'outline';
        }
    }


    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                       <TableHead>Nombre</TableHead>
                       <TableHead>Rol</TableHead>
                       <TableHead>Estado</TableHead>
                       <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.length > 0 ? users.map((user) => (
                        <TableRow key={user.uid}>
                            <TableCell className="font-medium">
                                <div>{user.displayName}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                            </TableCell>
                             <TableCell>
                                <Badge variant={getRoleVariant(user.role)}>{user.role}</Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(user.status)}>{user.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Abrir menú</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>Editar Rol</DropdownMenuItem>
                                        <DropdownMenuItem>
                                            {user.status === 'Activo' ? 'Desactivar' : 'Activar'}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No hay usuarios registrados.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
