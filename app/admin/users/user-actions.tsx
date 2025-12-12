'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { OrgRole } from '@prisma/client';

interface Membership {
  id: string;
  role: OrgRole;
  organization: {
    id: string;
    name: string;
  };
}

interface UserActionsProps {
  userId: string;
  isPlatformAdmin: boolean;
  memberships: Membership[];
  currentUserId: string;
}

const roles: OrgRole[] = ['owner', 'admin', 'manager', 'member', 'viewer'];

const roleColors: Record<OrgRole, string> = {
  owner: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  manager: 'bg-green-100 text-green-800 border-green-200',
  member: 'bg-gray-100 text-gray-800 border-gray-200',
  viewer: 'bg-gray-100 text-gray-600 border-gray-200',
};

export function UserActions({ userId, isPlatformAdmin, memberships, currentUserId }: UserActionsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSelf = userId === currentUserId;

  const togglePlatformAdmin = async () => {
    if (isSelf) {
      setError("You cannot change your own admin status");
      return;
    }

    setIsUpdating('admin');
    setError(null);

    try {
      const response = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPlatformAdmin: !isPlatformAdmin }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to update');
        return;
      }

      router.refresh();
    } catch {
      setError('An error occurred');
    } finally {
      setIsUpdating(null);
    }
  };

  const updateMembershipRole = async (membershipId: string, newRole: OrgRole) => {
    setIsUpdating(membershipId);
    setError(null);

    try {
      const response = await fetch(`/api/v1/admin/memberships/${membershipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to update');
        return;
      }

      router.refresh();
    } catch {
      setError('An error occurred');
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">{error}</p>
      )}

      {/* Platform Admin Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 w-28">Platform Admin:</span>
        <Button
          variant={isPlatformAdmin ? "destructive" : "outline"}
          size="sm"
          onClick={togglePlatformAdmin}
          disabled={isUpdating === 'admin' || isSelf}
          className="min-w-[80px]"
        >
          {isUpdating === 'admin' ? '...' : isPlatformAdmin ? 'Revoke' : 'Grant'}
        </Button>
        {isSelf && <span className="text-xs text-gray-400">(self)</span>}
      </div>

      {/* Organization Roles */}
      {memberships.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm text-gray-600">Organization Roles:</span>
          {memberships.map((membership) => (
            <div key={membership.id} className="flex items-center gap-2 ml-2">
              <span className="text-sm text-gray-500 w-32 truncate" title={membership.organization.name}>
                {membership.organization.name}:
              </span>
              <select
                value={membership.role}
                onChange={(e) => updateMembershipRole(membership.id, e.target.value as OrgRole)}
                disabled={isUpdating === membership.id}
                className={`text-xs font-medium px-2 py-1 rounded-full border cursor-pointer ${roleColors[membership.role]}`}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              {isUpdating === membership.id && (
                <span className="text-xs text-gray-400">saving...</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
