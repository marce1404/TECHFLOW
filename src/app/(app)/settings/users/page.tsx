
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import UsersTable from '@/components/settings/users-table';
import { useWorkOrders } from '@/context/work-orders-context';
import { useAuth } from '@/context/auth-context';
import { UserInviteForm } from '@/components/settings/user-invite-form';

export default function UsersPage() {
    const { userProfile } = useAuth();
    
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
            <UserInviteForm />
            <Card>
                <CardHeader>
                    <CardTitle>Usuarios Existentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <UsersTable />
                </CardContent>
            </Card>
        </div>
    );
}
