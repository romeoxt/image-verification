'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, User as UserIcon, Trash2, Mail, Shield } from 'lucide-react';
import { createUser, deleteUser } from './actions';
import { useRouter } from 'next/navigation';

// Type from db.ts
interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: Date;
  last_login_at: Date | null;
}

export default function UsersClientPage({ users }: { users: User[] }) {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await createUser(formData);
    
    if (result.error) {
      alert(result.error);
    } else {
      setIsCreating(false);
      // Data is revalidated by server action, but we might need to refresh router to see it if using client cache
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    await deleteUser(id);
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Manage team access and roles.
          </p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'Cancel' : <><Plus className="h-4 w-4 mr-2" /> Add User</>}
        </Button>
      </div>

      {isCreating && (
        <Card className="border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10">
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input name="email" type="email" required className="w-full p-2 rounded border" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input name="fullName" type="text" className="w-full p-2 rounded border" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input name="password" type="password" required className="w-full p-2 rounded border" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select name="role" className="w-full p-2 rounded border bg-background">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>
              <Button type="submit">Create User</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <table className="w-full caption-bottom text-sm text-left">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50">
              <th className="h-12 px-4 align-middle font-medium text-muted-foreground">User</th>
              <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Role</th>
              <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Created</th>
              <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Last Login</th>
              <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name || 'Unnamed'}</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' 
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 align-middle">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 align-middle">
                    {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="p-4 align-middle text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleDelete(user.id)}
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

