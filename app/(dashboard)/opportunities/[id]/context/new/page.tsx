'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const sourceTypes = [
  { value: 'manual_paste', label: 'Notes / Paste', icon: '📝' },
  { value: 'email', label: 'Email Thread', icon: '📧' },
  { value: 'call_transcript', label: 'Call Transcript', icon: '📞' },
  { value: 'meeting_notes', label: 'Meeting Notes', icon: '📋' },
  { value: 'slack', label: 'Slack / Chat', icon: '💬' },
  { value: 'document_upload', label: 'Document', icon: '📄' },
];

export default function AddContextPage() {
  const router = useRouter();
  const params = useParams();
  const opportunityId = params.id as string;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const [sourceType, setSourceType] = useState('manual_paste');
  const [content, setContent] = useState('');
  const [metadata, setMetadata] = useState({
    name: '',
    date: '',
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const text = await file.text();
        setContent(text);
        setMetadata((prev) => ({ ...prev, name: file.name }));
        setSourceType('document_upload');
      } else {
        setError('Please drop a text file (.txt or .md)');
      }
    }

    // Handle dropped text
    const text = e.dataTransfer.getData('text/plain');
    if (text) {
      setContent(text);
    }
  }, []);

  const handlePaste = useCallback((_e: React.ClipboardEvent) => {
    // Let the textarea handle the paste naturally
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please enter or paste some content');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        sourceType,
        rawContent: content,
        sourceMetadata: {
          name: metadata.name || undefined,
          date: metadata.date || undefined,
        },
      };

      const response = await fetch(`/api/v1/opportunities/${opportunityId}/context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save context');
      }

      router.push(`/opportunities/${opportunityId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/opportunities" className="hover:text-gray-700">
            Opportunities
          </Link>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <Link href={`/opportunities/${opportunityId}`} className="hover:text-gray-700">
            Opportunity
          </Link>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-gray-700">Add Context</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Add Deal Context</h2>
        <p className="mt-1 text-sm text-gray-500">
          Paste emails, notes, or call transcripts to improve proposal quality.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Source Type</CardTitle>
            <CardDescription>What kind of context are you adding?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
              {sourceTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSourceType(type.value)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors ${
                    sourceType === type.value
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
            <CardDescription>Paste or drag content below</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              ref={dropRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-lg border-2 border-dashed transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300'
              }`}
            >
              {isDragging && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 rounded-lg z-10">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                    </svg>
                    <p className="mt-2 text-sm font-medium text-blue-600">Drop file here</p>
                  </div>
                </div>
              )}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handlePaste}
                placeholder="Paste email threads, meeting notes, call transcripts, or any relevant deal context here...

You can also drag and drop text files (.txt, .md)"
                rows={12}
                className="w-full rounded-lg border-0 px-4 py-3 text-sm focus:outline-none focus:ring-0 resize-none"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {content.length > 0 ? `${content.length.toLocaleString()} characters` : 'Paste, type, or drop a file'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata (Optional)</CardTitle>
            <CardDescription>Additional context about this content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Source Name</Label>
                <input
                  id="name"
                  type="text"
                  value={metadata.name}
                  onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
                  placeholder="e.g., Discovery Call with John"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <input
                  id="date"
                  type="date"
                  value={metadata.date}
                  onChange={(e) => setMetadata({ ...metadata, date: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !content.trim()}>
            {saving ? 'Saving...' : 'Add Context'}
          </Button>
        </div>
      </form>
    </div>
  );
}
