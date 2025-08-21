
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
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import type { AppUser } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '../ui/skeleton';
import { updateUserRoleAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { UserEditDialog } from './user-edit-dialog';

export default function UsersTable() {
    const { users, loading, fetchUsers } = useAuth();
    const { toast } = useToast();
    const [selectedUser, setSelectedUser] = React.useState<AppUser | null>(null);
    const [dialogOpen, setDialogOpen] = React.useState(false);

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
    
    const userRoles: AppUser['role'][] = ['Admin', 'Supervisor', 'Técnico', 'Visor'];

    const handleRoleChange = async (uid: string, role: AppUser['role']) => {
        const result = await updateUserRoleAction(uid, role);
        if (result.success) {
            toast({ title: 'Éxito', description: result.message });
            fetchUsers();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    };
    
    const handleEditClick = (user: AppUser) => {
        setSelectedUser(user);
        setDialogOpen(true);
    }


    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
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
                                             <DropdownMenuItem onSelect={() => handleEditClick(user)}>
                                                Editar Usuario
                                            </DropdownMenuItem>
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>Cambiar Rol</DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                        {userRoles.map(role => (
                                                            <DropdownMenuItem key={role} onSelect={() => handleRoleChange(user.uid, role)}>
                                                                {role}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
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
            <UserEditDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                user={selectedUser}
            />
        </>
    );
}
