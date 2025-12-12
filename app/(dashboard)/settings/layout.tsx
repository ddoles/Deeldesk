'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const settingsNavigation = [
  { name: 'General', href: '/settings' },
  { name: 'Members', href: '/settings/members' },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
        <p className="text-sm text-gray-500">
          Manage your organization&apos;s settings and members
        </p>
      </div>

      <div className="flex gap-6">
        {/* Settings Navigation */}
        <nav className="w-48 shrink-0">
          <ul className="space-y-1">
            {settingsNavigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'block rounded-md px-3 py-2 text-sm font-medium',
                    pathname === item.href
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Settings Content */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
