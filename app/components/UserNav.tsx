'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

export function UserNav() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex gap-3">
        <div className="w-20 h-8 bg-slate-200 animate-pulse rounded"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex gap-3">
        <a
          href="/login"
          className="text-slate-600 font-medium hover:text-slate-900 px-3 py-2"
        >
          Log in
        </a>
        <a
          href="/login"
          className="bg-slate-900 text-white px-4 py-2 rounded-full font-medium hover:bg-slate-800 transition-colors"
        >
          Sign up
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="hidden md:flex items-center gap-2 text-sm text-slate-600">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center text-white font-medium text-xs">
          {user.email?.charAt(0).toUpperCase() || 'U'}
        </div>
        <span className="max-w-[150px] truncate">{user.email}</span>
      </div>
      <button
        onClick={handleLogout}
        className="text-slate-600 font-medium hover:text-slate-900 px-3 py-2 text-sm"
      >
        Log out
      </button>
    </div>
  );
}
