
'use client';

import * as React from 'react';
import { SmtpForm } from '@/components/settings/smtp-form';
import { useWorkOrders } from '@/context/work-orders-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SmtpSettingsPage() {
  const { loading: workOrdersLoading } = useWorkOrders();
  const { loading: authLoading, userProfile } = useAuth();
  const loading = workOrdersLoading || authLoading;

  if (loading) {
      return (
          <div className="space-y-4">
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-8 w-2/3" />
              <div className="space-y-2 pt-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-12 w-full" />
              </div>
          </div>
      )
  }

  if (userProfile?.role !== 'Admin') {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Acceso Denegado</CardTitle>
                <CardDescription>No tienes permisos para configurar el servidor de correo.</CardDescription>
            </CardHeader>
        </Card>
    );
  }


  return <SmtpForm />;
}
