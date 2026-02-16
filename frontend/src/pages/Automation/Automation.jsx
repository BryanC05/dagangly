import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
import './Automation.css';

const Automation = () => {
  const { user } = useAuthStore();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await api.get('/workflows');
      setWorkflows(response.data);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflow = async (workflowId, currentStatus) => {
    try {
      await api.patch(`/workflows/${workflowId}/toggle`);
      setWorkflows(workflows.map(w =>
        w._id === workflowId ? { ...w, isActive: !currentStatus } : w
      ));
    } catch (error) {
      console.error('Failed to toggle workflow:', error);
    }
  };

  const createWorkflow = async (type) => {
    try {
      const workflowConfig = {
        order_confirmation: {
          name: 'Order Confirmation Email',
          type: 'order_confirmation',
          webhookUrl: 'http://localhost:5678/webhook/msme-trigger',
          config: {
            template: 'default',
            includeItems: true,
          },
        },
      };

      const response = await api.post('/workflows', workflowConfig[type]);
      setWorkflows([...workflows, response.data]);
      setShowSetupModal(false);
      alert('Workflow created! Now configure it in n8n at http://localhost:5678');
    } catch (error) {
      console.error('Failed to create workflow:', error);
      alert('Failed to create workflow: ' + error.message);
    }
  };

  const deleteWorkflow = async (workflowId) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      await api.delete(`/workflows/${workflowId}`);
      setWorkflows(workflows.filter(w => w._id !== workflowId));
    } catch (error) {
      console.error('Failed to delete workflow:', error);
    }
  };

  if (!user?.automationEnabled) {
    return (
      <div className="automation-container">
        <Card>
          <CardHeader>
            <CardTitle>Automation Features</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Automation features are currently in beta.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Contact support to request access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="automation-container p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Automation</h1>
          <p className="text-muted-foreground">Automate your business processes</p>
        </div>
        <Button onClick={() => setShowSetupModal(true)}>
          + Create Workflow
        </Button>
      </div>

      {loading ? (
        <div>Loading workflows...</div>
      ) : workflows.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No workflows configured yet</p>
            <Button onClick={() => setShowSetupModal(true)}>
              Create Your First Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {workflows.map(workflow => (
            <Card key={workflow._id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-semibold">{workflow.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Triggered {workflow.executionCount} times
                      {workflow.lastExecuted && (
                        <> • Last run: {new Date(workflow.lastExecuted).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                  <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                    {workflow.isActive ? 'Active' : 'Paused'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleWorkflow(workflow._id, workflow.isActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${workflow.isActive ? 'bg-primary' : 'bg-gray-200'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${workflow.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteWorkflow(workflow._id)}
                    className="text-destructive"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">n8n Configuration</h4>
        <p className="text-sm text-muted-foreground mb-2">
          Access n8n at: <a href="http://localhost:5678" target="_blank" rel="noopener noreferrer" className="text-primary underline">http://localhost:5678</a>
        </p>
        <p className="text-sm text-muted-foreground">
          Login: admin / msme2024
        </p>
      </div>

      {showSetupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <button
                  className="w-full p-4 border rounded-lg hover:bg-muted text-left transition-colors"
                  onClick={() => createWorkflow('order_confirmation')}
                >
                  <h4 className="font-semibold">Order Confirmation</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically send confirmation emails when orders are placed
                  </p>
                </button>
              </div>
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => setShowSetupModal(false)}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Automation;
