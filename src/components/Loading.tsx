import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export default function Loading({ message = 'Chargement...', fullScreen = false }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
      <p className="text-gray-600">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20">
      {content}
    </div>
  );
}

// Skeleton pour les cartes de chantier
export function ChantierCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="h-6 bg-gray-200 rounded w-2/3"></div>
        <div className="h-6 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="h-2 bg-gray-200 rounded-full"></div>
      </div>
      <div className="mt-4 border-t pt-4">
        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
        <div className="space-y-2">
          <div className="h-8 bg-gray-100 rounded"></div>
          <div className="h-8 bg-gray-100 rounded"></div>
        </div>
      </div>
    </div>
  );
}

// Skeleton pour la liste
export function ChantierListSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4 animate-pulse flex items-center gap-4">
      <div className="w-2 h-16 bg-gray-200 rounded-full"></div>
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-20 hidden sm:block"></div>
      <div className="h-8 bg-gray-200 rounded w-20 hidden sm:block"></div>
      <div className="h-8 bg-gray-200 rounded w-12"></div>
    </div>
  );
}
