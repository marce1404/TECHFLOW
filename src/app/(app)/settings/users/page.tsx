

'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import UsersTable from '@/components/settings/users-table';
import { useAuth } from '@/context/auth-context';
import { UserInviteForm } from '@/components/settings/user-invite-form';
import { Shield, Eye, HardHat, UserCog } from 'lucide-react';
import { listUsersAction } from '@/app/actions';
import type { AppUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function UsersPage() {
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const [users, setUsers] = React.useState<AppUser[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchUsers = React.useCallback(async () => {
        if (userProfile?.role !== 'Admin') {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const result = await listUsersAction();
            if (result.success && result.users) {
                setUsers(result.users);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error al cargar usuarios',
                    description: result.message,
                });
                setUsers([]);
            }
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Error inesperado',
                description: 'No se pudieron cargar los usuarios.',
            });
        } finally {
            setLoading(false);
        }
    }, [userProfile, toast]);

    React.useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    if (userProfile?.role !== 'Admin') {
        return (
            <div className="flex flex-col gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Acceso Denegado</CardTitle>
                        <CardDescription>
                            No tienes los permisos necesarios para administrar usuarios.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8">
            <UserInviteForm onUserAdded={fetchUsers} />

             <Card>
                <CardHeader>
                    <CardTitle>Privilegios de Roles</CardTitle>
                    <CardDescription>
                        Entiende lo que cada rol puede hacer dentro del sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-primary/5">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <UserCog className="h-8 w-8 text-primary" />
                            <div>
                                <CardTitle className="text-lg">Admin</CardTitle>
                                <CardDescription>Control total</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground space-y-1">
                            <p>• Ver todo el sistema.</p>
                            <p>• Crear, editar y eliminar cualquier registro.</p>
                            <p>• Gestionar usuarios y configuraciones.</p>
                        </CardContent>
                    </Card>
                     <Card className="bg-secondary/50">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Shield className="h-8 w-8 text-secondary-foreground" />
                            <div>
                                <CardTitle className="text-lg">Supervisor</CardTitle>
                                <CardDescription>Gestión operativa</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground space-y-1">
                           <p>• Ver todo el sistema.</p>
                           <p>• Crear y editar la mayoría de registros.</p>
                           <p>• No puede gestionar usuarios ni configuraciones.</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <HardHat className="h-8 w-8 text-orange-500" />
                            <div>
                                <CardTitle className="text-lg">Técnico</CardTitle>
                                <CardDescription>Ejecución y reportes</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground space-y-1">
                            <p>• Solo puede ver módulos operativos.</p>
                            <p>• Puede llenar y enviar informes de servicio.</p>
                            <p>• No puede crear, editar ni eliminar registros.</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Eye className="h-8 w-8 text-gray-500" />
                            <div>
                                <CardTitle className="text-lg">Visor</CardTitle>
                                <CardDescription>Solo lectura</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground space-y-1">
                            <p>• Acceso de solo lectura a todo el sistema.</p>
                            <p>• No puede realizar ninguna acción de escritura.</p>
                            <p>• Ideal para roles de consulta o gerenciales.</p>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Usuarios Existentes</CardTitle>
                    <CardDescription>Gestiona los usuarios y sus roles de acceso al sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                    <UsersTable users={users} loading={loading} onDataChange={fetchUsers} />
                </CardContent>
            </Card>
        </div>
    );
}
