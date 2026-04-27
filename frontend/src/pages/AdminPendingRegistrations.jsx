import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, User, Building2, MapPin, Mail } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import api from '../utils/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function AdminPendingRegistrations() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: registrations, isLoading, refetch } = useQuery({
    queryKey: ['pendingRegistrations'],
    queryFn: async () => {
      const response = await api.get('/admin/registrations/pending');
      return response.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await api.post(`/admin/registrations/${userId}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRegistrations'] });
      alert('Registration approved!');
      refetch();
    },
    onError: (error) => {
      alert(`Failed: ${error.response?.data?.error || error.message}`);
    },
  });

  const denyMutation = useMutation({
    mutationFn: async ({ userId, reason }) => {
      const response = await api.post(`/admin/registrations/${userId}/deny`, { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRegistrations'] });
      alert('Registration denied!');
      refetch();
    },
    onError: (error) => {
      alert(`Failed: ${error.response?.data?.error || error.message}`);
    },
  });

  const handleDeny = (userId) => {
    const reason = prompt('Denial reason (optional):');
    denyMutation.mutate({ userId, reason: reason || '' });
  };

  return (
    <>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Business Registrations</h1>
          <p className="text-muted-foreground">
            Review and approve seller business registrations
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Registrations ({registrations?.total || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : !registrations?.registrations || registrations.registrations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending business registrations
              </div>
            ) : (
              <div className="space-y-4">
                {registrations.registrations.map((reg) => (
                  <div
                    key={reg._id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{reg.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {reg.email}
                        </p>
                        {reg.businessName && (
                          <p className="text-sm font-medium mt-1">
                            {reg.businessName}
                          </p>
                        )}
                        {reg.businessAddress && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {reg.businessAddress}
                          </p>
                        )}
                        {reg.businessCategory && (
                          <p className="text-sm text-muted-foreground">
                            Category: {reg.businessCategory}
                          </p>
                        )}
                        {reg.npwp && (
                          <p className="text-xs text-muted-foreground">
                            NPWP: {reg.npwp}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Submitted: {reg.registeredAt ? new Date(reg.registeredAt).toLocaleString('id-ID') : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => approveMutation.mutate(reg._id)}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeny(reg._id)}
                        disabled={denyMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Deny
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default AdminPendingRegistrations;