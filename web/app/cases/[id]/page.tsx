'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { getCase, listCaseNotes, addCaseNote, updateCaseStatus } from '@/lib/api';
import type { CaseRecord, CaseNote } from '@/lib/types';
import CopyableID from '@/components/CopyableID';
import { formatRelativeTime } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  opened: 'bg-blue-500/10 text-blue-400',
  under_review: 'bg-yellow-500/10 text-yellow-400',
  analysis_completed: 'bg-green-500/10 text-green-400',
  escalated: 'bg-orange-500/10 text-orange-400',
  closed: 'bg-gray-500/10 text-gray-400',
};

export default function CaseDetail() {
  const params = useParams();
  const caseId = params.id as string;
  const router = useRouter();

  const [caseData, setCaseData] = useState<CaseRecord | null>(null);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const loadCase = async () => {
      try {
        const [caseResult, notesResult] = await Promise.all([
          getCase(caseId),
          listCaseNotes(caseId),
        ]);
        setCaseData(caseResult);
        setNotes(notesResult || []);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadCase();
  }, [caseId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setSubmittingNote(true);
    try {
      const newNote = await addCaseNote(caseId, { content: noteContent.trim() });
      setNotes([newNote, ...notes]);
      setNoteContent('');
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const updated = await updateCaseStatus(caseId, newStatus);
      setCaseData(updated);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading case...</p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-red-400">{error || 'Case not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/cases" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Cases
        </Link>

        {/* Header */}
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{caseData.title}</h1>
              <div className="flex gap-2 items-center">
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[caseData.status]}`}>
                  {caseData.status.replace(/_/g, ' ')}
                </span>
                {caseData.priority && (
                  <span className="text-sm text-muted-foreground">Priority: {caseData.priority}</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-2">Case ID</p>
              <CopyableID value={caseData.id} abbreviated={false} />
            </div>
          </div>

          {/* Case Info */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Created</p>
              <p className="text-sm text-foreground">{formatRelativeTime(caseData.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Updated</p>
              <p className="text-sm text-foreground">{formatRelativeTime(caseData.updated_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Players</p>
              <p className="text-sm text-foreground">{caseData.players?.length || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Event</p>
              <p className="text-sm text-foreground">{caseData.event_id || '—'}</p>
            </div>
          </div>

          {/* Status Change */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm font-semibold text-foreground mb-2">Change Status</p>
            <div className="flex flex-wrap gap-2">
              {['opened', 'under_review', 'analysis_completed', 'escalated', 'closed'].map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={updatingStatus || caseData.status === status}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    caseData.status === status
                      ? STATUS_COLORS[status]
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {status.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        {caseData.summary && (
          <div className="card p-6">
            <h2 className="font-semibold text-foreground mb-3">Summary</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{caseData.summary}</p>
          </div>
        )}

        {/* Players */}
        {caseData.players && caseData.players.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold text-foreground mb-3">Involved Players</h2>
            <div className="space-y-2">
              {caseData.players.map((player, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                  <span className="font-medium text-foreground">{player}</span>
                  <button className="text-primary text-xs hover:underline">View Analysis</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {caseData.tags && caseData.tags.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold text-foreground mb-3">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {caseData.tags.map((tag, idx) => (
                <span key={idx} className="px-2 py-1 bg-accent/10 text-accent rounded text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Add Note */}
        <form onSubmit={handleAddNote} className="card p-6">
          <h2 className="font-semibold text-foreground mb-3">Add Investigation Note</h2>
          <div className="space-y-3">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Add your investigation notes, findings, or updates here..."
              rows={4}
              className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <button
              type="submit"
              disabled={!noteContent.trim() || submittingNote}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 disabled:opacity-50 transition"
            >
              <Plus className="w-4 h-4" />
              {submittingNote ? 'Adding...' : 'Add Note'}
            </button>
          </div>
        </form>

        {/* Notes Timeline */}
        {notes.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold text-foreground mb-4">Investigation Timeline</h2>
            <div className="space-y-3">
              {notes.map((note, idx) => (
                <div key={note.id} className="p-4 bg-muted/30 rounded border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(note.created_at)}</p>
                    {note.created_by && (
                      <p className="text-xs text-muted-foreground">By: {note.created_by}</p>
                    )}
                  </div>
                  <p className="text-sm text-foreground">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {notes.length === 0 && (
          <div className="card p-6 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No investigation notes yet</p>
          </div>
        )}
      </div>
    </main>
  );
}
