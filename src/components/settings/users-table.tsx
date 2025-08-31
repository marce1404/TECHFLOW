
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { AppUser } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { UserEditDialog } from './user-edit-dialog';
import { deleteUserAction, toggleUserStatusAction } from '@/app/actions';
import { UserChangePasswordDialog } from './user-change-password-dialog';
import { UserSendInvitationDialog } from './user-send-invitation-dialog';
import { useWorkOrders } from '@/context/work-orders-context';

export default function UsersTable() {
    const { user: currentUser, users, loading, fetchUsers } = useAuth();
    const { toast } = useToast();
    const [selectedUser, setSelectedUser] = React.useState<AppUser | null>(null);
    const [editDialogOpen, setEditDialogOpen] = React.useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = React.useState(false);
    const [deleteAlertOpen, setDeleteAlertOpen] = React.useState(false);
    const [invitationDialogOpen, setInvitationDialogOpen] = React.useState(false);
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 15;


    const handleEditClick = (user: AppUser) => {
        setSelectedUser(user);
        setEditDialogOpen(true);
    }
    
    const handleDeleteClick = (user: AppUser) => {
        setSelectedUser(user);
        setDeleteAlertOpen(true);
    }
    
    const handleChangePasswordClick = (user: AppUser) => {
        setSelectedUser(user);
        setPasswordDialogOpen(true);
    }
    
    const handleSendInvitationClick = (user: AppUser) => {
        setSelectedUser(user);
        setInvitationDialogOpen(true);
    }

    const confirmDelete = async () => {
        if (!selectedUser) return;
        const result = await deleteUserAction(selectedUser.uid);
        if (result.success) {
            toast({ title: 'Éxito', description: result.message });
            await fetchUsers();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        setDeleteAlertOpen(false);
        setSelectedUser(null);
    }

    const handleToggleStatus = async (user: AppUser) => {
        const result = await toggleUserStatusAction(user.uid, user.status);
        
        if(result.success) {
            toast({ title: 'Éxito', description: `El estado de ${user.displayName} ha sido actualizado.` });
            await fetchUsers(); // Re-fetch all users to update the UI
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    }

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
    
    const totalPages = Math.ceil(users.length / itemsPerPage);
    const paginatedData = users.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };


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
                        {paginatedData.length > 0 ? paginatedData.map((user) => (
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
                                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={user.uid === currentUser?.uid}>
                                                <span className="sr-only">Abrir menú</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                             <DropdownMenuItem onSelect={() => handleEditClick(user)}>
                                                Editar Usuario
                                            </DropdownMenuItem>
                                             <DropdownMenuItem onSelect={() => handleChangePasswordClick(user)}>
                                                Cambiar Contraseña
                                            </DropdownMenuItem>
                                             <DropdownMenuItem onSelect={() => handleSendInvitationClick(user)}>
                                                Enviar/Reenviar Invitación
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleToggleStatus(user)}>
                                                {user.status === 'Activo' ? 'Desactivar' : 'Activar'}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem 
                                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                onSelect={() => handleDeleteClick(user)}
                                            >
                                                Eliminar
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
             {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
                    <div>
                        Mostrando {paginatedData.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} a {Math.min(currentPage * itemsPerPage, users.length)} de {users.length} usuarios.
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>Anterior</Button>
                        <span>Página {currentPage} de {totalPages > 0 ? totalPages : 1}</span>
                        <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}>Siguiente</Button>
                    </div>
                </div>
            )}
             <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente al usuario <span className="font-bold">{selectedUser?.displayName}</span> de la autenticación de Firebase y de la base de datos.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSelectedUser(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={confirmDelete}
                    >
                        Sí, eliminar usuario
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <UserEditDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                user={selectedUser}
            />
            <UserChangePasswordDialog
                open={passwordDialogOpen}
                onOpenChange={setPasswordDialogOpen}
                user={selectedUser}
            />
             <UserSendInvitationDialog
                open={invitationDialogOpen}
                onOpenChange={setInvitationDialogOpen}
                user={selectedUser}
            />
        </>
    );
}
