'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // Temporary redirect to /our-programs
    router.replace('/our-programs');
  }, [router]);

  return null;
}
