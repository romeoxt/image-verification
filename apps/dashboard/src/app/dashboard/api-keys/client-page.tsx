'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Key, Copy, Check, Trash2 } from 'lucide-react';
import { createApiKey, revokeApiKey } from './actions';

export default function ApiKeysPage({ initialKeys }: { initialKeys: any[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const result = await createApiKey("New Key"); // In a real app, prompt for name
      if (result.success && result.key) {
        setNewKey(result.rawKey);
        setKeys([result.key, ...keys]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this key? Apps using it will stop working immediately.')) return;
    
    try {
      const result = await revokeApiKey(id);
      if (result.success) {
        setKeys(keys.filter(k => k.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Manage access keys for your organization's devices and integrations.
          </p>
        </div>
        <Button onClick={handleCreate} disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Key
        </Button>
      </div>

      {newKey && (
        <Card className="border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20">
          <CardHeader>
            <CardTitle className="text-emerald-700 dark:text-emerald-400">New API Key Created</CardTitle>
            <CardDescription className="text-emerald-600/80 dark:text-emerald-400/80">
              Please copy this key now. You won't be able to see it again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-white dark:bg-black rounded border font-mono text-sm break-all">
                {newKey}
              </code>
              <Button size="icon" variant="outline" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <table className="w-full caption-bottom text-sm text-left">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50">
              <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Name</th>
              <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Key Prefix</th>
              <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Created</th>
              <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Last Used</th>
              <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {keys.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No API keys found. Create one to get started.
                </td>
              </tr>
            ) : (
              keys.map((key) => (
                <tr key={key.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle font-medium">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-slate-400" />
                      {key.name}
                    </div>
                  </td>
                  <td className="p-4 align-middle font-mono text-xs">
                    {key.key_prefix}...
                  </td>
                  <td className="p-4 align-middle">
                    {new Date(key.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 align-middle">
                    {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="p-4 align-middle text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleRevoke(key.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

