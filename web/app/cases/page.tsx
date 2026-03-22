'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Filter } from 'lucide-react';
import Link from 'next/link';
import { listCases } from '@/lib/api';
import type { CaseRecord } from '@/lib/types';
import DataTable, { type Column } from '@/components/DataTable';
import { formatRelativeTime } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  opened: 'bg-blue-500/10 text-blue-400',
  under_review: 'bg-yellow-500/10 text-yellow-400',
  analysis_completed: 'bg-green-500/10 text-green-400',
  escalated: 'bg-orange-500/10 text-orange-400',
  closed: 'bg-gray-500/10 text-gray-400',
};

export default function CasesPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const loadCases = async () => {
      try {
        const response = await listCases(500);
        setCases(response.cases || []);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadCases();
  }, []);

  const filteredCases = statusFilter === 'all' 
    ? cases 
    : cases.filter(c => c.status === statusFilter);

  const columns: Column<CaseRecord>[] = [
    {
      key: 'id',
      label: 'Case ID',
      render: (value) => <span className="monospace text-xs">{String(value).slice(0, 8)}...</span>,
    },
    {
      key: 'title',
      label: 'Title',
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[String(value)] || 'bg-muted'}`}>
          {String(value).replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'players',
      label: 'Players',
      render: (value) => <span>{Array.isArray(value) ? value.length : 0}</span>,
    },
    {
      key: 'event_id',
      label: 'Event',
      render: (value) => <span className="text-sm text-muted-foreground">{value || '—'}</span>,
    },
    {
      key: 'updated_at',
      label: 'Updated',
      render: (value) => <span className="text-xs text-muted-foreground">{formatRelativeTime(String(value))}</span>,
    },
  ];

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Investigation Cases</h1>
            <p className="text-muted-foreground mt-1">Manage and track integrity investigations</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 transition">
            <Plus className="w-4 h-4" />
            New Case
          </button>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-input border border-border rounded px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="opened">Opened</option>
              <option value="under_review">Under Review</option>
              <option value="analysis_completed">Analysis Completed</option>
              <option value="escalated">Escalated</option>
              <option value="closed">Closed</option>
            </select>
            <span className="text-xs text-muted-foreground ml-auto">
              {filteredCases.length} case{filteredCases.length !== 1 ? 's' : ''}
            </span>
          </div>

          <DataTable
            columns={columns}
            data={filteredCases}
            rowKey="id"
            loading={loading}
            emptyMessage={error || 'No cases found'}
            hover
            striped
          />
        </div>
      </div>
    </main>
  );
}
