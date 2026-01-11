import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { Button, Card } from '~/components';
import { formatCurrency } from '~/lib/finance';

export const Route = createFileRoute('/rep/')({
  component: RepDashboard,
});

type Tab = 'sessions' | 'vehicles' | 'approvals';

function RepDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('sessions');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'sessions', label: 'Sessions' },
    { id: 'vehicles', label: 'Vehicles' },
    { id: 'approvals', label: 'Approvals' },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Rep Dashboard
            </h1>
            <a
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Back to Home
            </a>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'sessions' && <SessionsTab />}
        {activeTab === 'vehicles' && <VehiclesTab />}
        {activeTab === 'approvals' && <ApprovalsTab />}
      </div>
    </main>
  );
}

// ============ SESSIONS TAB ============

function SessionsTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedApprovalId, setSelectedApprovalId] = useState<string>('');
  const [newSessionLink, setNewSessionLink] = useState<string | null>(null);

  const { data: sessions, isLoading } = useQuery({
    ...convexQuery(api.sessions.list, {}),
  });

  const { data: approvals } = useQuery({
    ...convexQuery(api.approvals.list, {}),
  });

  const { mutateAsync: createSession, isPending: isCreating } = useMutation({
    mutationFn: useConvexMutation(api.sessions.create),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  const handleCreateSession = async () => {
    if (!selectedApprovalId) return;

    const result = await createSession({
      approvalId: selectedApprovalId as Id<'approvals'>,
      repId: 'rep_001',
    });

    if (result?.token) {
      const link = `${window.location.origin}/a/${result.token}`;
      setNewSessionLink(link);

      // Store token for later retrieval in RepSessionView
      const existingTokens = JSON.parse(localStorage.getItem('sessionTokens') || '{}');
      existingTokens[result.sessionId] = result.token;
      localStorage.setItem('sessionTokens', JSON.stringify(existingTokens));
    }
  };

  const activeApprovals = approvals?.filter(a => a.status === 'active') || [];

  return (
    <div className="space-y-6">
      {/* Create Session */}
      <Card padding="lg" shadow="sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Create Magic Link
        </h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Select Approval
            </label>
            <select
              value={selectedApprovalId}
              onChange={(e) => setSelectedApprovalId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Choose an approval...</option>
              {activeApprovals.map((approval) => (
                <option key={approval._id} value={approval._id}>
                  {approval.customerName} - {formatCurrency(approval.approvalAmount)}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={handleCreateSession}
            disabled={!selectedApprovalId || isCreating}
            loading={isCreating}
          >
            Generate Link
          </Button>
        </div>

        {newSessionLink && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
              Magic link created!
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSessionLink}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(newSessionLink);
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Sessions List */}
      <Card padding="lg" shadow="sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Active Sessions
        </h2>
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        ) : sessions?.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No sessions yet.</p>
        ) : (
          <div className="space-y-3">
            {sessions?.map((session) => (
              <div
                key={session._id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {session.approval?.customerName || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {session.vehicle?.title || 'Unknown vehicle'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {(session.status === 'pending' || session.status === 'verified' || session.status === 'active') && (
                    <Button
                      size="sm"
                      onClick={() => navigate({ to: '/rep/session/$sessionId', params: { sessionId: session._id } })}
                    >
                      Join Session
                    </Button>
                  )}
                  <div className="text-right">
                    <span
                      className={`
                        inline-block px-2 py-1 text-xs font-medium rounded-full
                        ${session.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
                        ${session.status === 'verified' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
                        ${session.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                        ${session.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' : ''}
                        ${session.status === 'locked' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
                        ${session.status === 'expired' ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' : ''}
                      `}
                    >
                      {session.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ============ VEHICLES TAB ============

function VehiclesTab() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: vehicles, isLoading } = useQuery({
    ...convexQuery(api.vehicles.list, {}),
  });

  const { mutateAsync: createVehicle, isPending: isCreating } = useMutation({
    mutationFn: useConvexMutation(api.vehicles.create),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setIsAdding(false);
    },
  });

  const { mutateAsync: updateVehicle } = useMutation({
    mutationFn: useConvexMutation(api.vehicles.update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setEditingId(null);
    },
  });

  const { mutateAsync: deleteVehicle } = useMutation({
    mutationFn: useConvexMutation(api.vehicles.remove),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Vehicles ({vehicles?.length || 0})
        </h2>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          Add Vehicle
        </Button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <VehicleForm
          onSubmit={async (data) => {
            await createVehicle(data);
          }}
          onCancel={() => setIsAdding(false)}
          isLoading={isCreating}
        />
      )}

      {/* List */}
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      ) : vehicles?.length === 0 ? (
        <Card padding="lg" shadow="sm">
          <p className="text-gray-500 dark:text-gray-400 text-center">
            No vehicles yet. Add one to get started.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {vehicles?.map((vehicle) => (
            <Card key={vehicle._id} padding="md" shadow="sm">
              {editingId === vehicle._id ? (
                <VehicleForm
                  initialData={vehicle}
                  onSubmit={async (data) => {
                    await updateVehicle({ id: vehicle._id, ...data });
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {vehicle.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                      {formatCurrency(vehicle.price)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(vehicle._id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Delete this vehicle?')) {
                          deleteVehicle({ id: vehicle._id });
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface VehicleFormProps {
  initialData?: {
    title: string;
    year: number;
    make: string;
    model: string;
    price: number;
  };
  onSubmit: (data: {
    title: string;
    year: number;
    make: string;
    model: string;
    price: number;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

function VehicleForm({ initialData, onSubmit, onCancel, isLoading }: VehicleFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [year, setYear] = useState(initialData?.year || new Date().getFullYear());
  const [make, setMake] = useState(initialData?.make || '');
  const [model, setModel] = useState(initialData?.model || '');
  const [price, setPrice] = useState(initialData?.price || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ title, year, make, model, price });
  };

  return (
    <Card padding="lg" shadow="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="2024 Ford F-650 Flatbed"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Year
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Make
            </label>
            <input
              type="text"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Ford"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Model
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="F-650"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Price
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            {initialData ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ============ APPROVALS TAB ============

function ApprovalsTab() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  const { data: approvals, isLoading } = useQuery({
    ...convexQuery(api.approvals.list, {}),
  });

  const { data: vehicles } = useQuery({
    ...convexQuery(api.vehicles.list, {}),
  });

  const { mutateAsync: createApproval, isPending: isCreating } = useMutation({
    mutationFn: useConvexMutation(api.approvals.create),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      setIsAdding(false);
    },
  });

  const { mutateAsync: cancelApproval } = useMutation({
    mutationFn: useConvexMutation(api.approvals.cancel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });

  const availableVehicles = vehicles?.filter(v => v.status === 'available') || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Approvals ({approvals?.length || 0})
        </h2>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          Add Approval
        </Button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <ApprovalForm
          vehicles={availableVehicles}
          onSubmit={async (data) => {
            await createApproval(data);
          }}
          onCancel={() => setIsAdding(false)}
          isLoading={isCreating}
        />
      )}

      {/* List */}
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      ) : approvals?.length === 0 ? (
        <Card padding="lg" shadow="sm">
          <p className="text-gray-500 dark:text-gray-400 text-center">
            No approvals yet. Add one to get started.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {approvals?.map((approval) => (
            <Card key={approval._id} padding="md" shadow="sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {approval.customerName}
                    </p>
                    <span
                      className={`
                        inline-block px-2 py-0.5 text-xs font-medium rounded-full
                        ${approval.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                        ${approval.status === 'used' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' : ''}
                        ${approval.status === 'expired' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
                        ${approval.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
                      `}
                    >
                      {approval.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {approval.customerEmail} | {approval.customerPhone}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {formatCurrency(approval.approvalAmount)} @ {(approval.apr * 100).toFixed(2)}% APR
                  </p>
                </div>
                <div className="flex gap-2">
                  {approval.status === 'active' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Cancel this approval?')) {
                          cancelApproval({ id: approval._id });
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface ApprovalFormProps {
  vehicles: Array<{ _id: Id<'vehicles'>; title: string; price: number }>;
  onSubmit: (data: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerLast4: string;
    vehicleId: Id<'vehicles'>;
    approvalAmount: number;
    apr: number;
    minTermMonths: number;
    maxTermMonths: number;
    balloonAllowed: boolean;
    maxBalloonPercent: number;
    documentFee: number;
    repId: string;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

function ApprovalForm({ vehicles, onSubmit, onCancel, isLoading }: ApprovalFormProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerLast4, setCustomerLast4] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [approvalAmount, setApprovalAmount] = useState(0);
  const [apr, setApr] = useState(7.99);
  const [balloonAllowed, setBalloonAllowed] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      customerId: `cust_${Date.now()}`,
      customerName,
      customerPhone,
      customerEmail,
      customerLast4,
      vehicleId: vehicleId as Id<'vehicles'>,
      approvalAmount,
      apr: apr / 100,
      minTermMonths: 24,
      maxTermMonths: 84,
      balloonAllowed,
      maxBalloonPercent: 30,
      documentFee: 499,
      repId: 'rep_001',
    });
  };

  return (
    <Card padding="lg" shadow="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="John Smith"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="555-123-4567"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Email
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="john@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              SSN Last 4
            </label>
            <input
              type="text"
              value={customerLast4}
              onChange={(e) => setCustomerLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="1234"
              maxLength={4}
              pattern="\d{4}"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Vehicle
            </label>
            <select
              value={vehicleId}
              onChange={(e) => {
                setVehicleId(e.target.value);
                const v = vehicles.find(v => v._id === e.target.value);
                if (v) setApprovalAmount(v.price + 10000);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select vehicle...</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.title} - {formatCurrency(v.price)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Approval Amount
            </label>
            <input
              type="number"
              value={approvalAmount}
              onChange={(e) => setApprovalAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              APR %
            </label>
            <input
              type="number"
              step="0.01"
              value={apr}
              onChange={(e) => setApr(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
            />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={balloonAllowed}
                onChange={(e) => setBalloonAllowed(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Allow balloon payments
              </span>
            </label>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            Create Approval
          </Button>
        </div>
      </form>
    </Card>
  );
}
