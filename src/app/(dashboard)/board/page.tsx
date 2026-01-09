'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function BoardIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to boards list page
    router.replace('/boards');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );
}
