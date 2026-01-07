import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showHomeLink?: boolean;
}

export default function ErrorMessage({
  title = 'Erreur',
  message,
  onRetry,
  showHomeLink = false
}: ErrorMessageProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-red-100 p-2 rounded-full">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-red-800">{title}</h3>
        </div>
        <p className="text-red-700 mb-4">{message}</p>
        <div className="flex gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
          )}
          {showHomeLink && (
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Home className="w-4 h-4" />
              Accueil
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
