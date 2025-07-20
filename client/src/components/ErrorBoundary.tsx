import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{error: Error}>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error!} />;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">خطا در بارگذاری</h2>
            <p className="text-gray-600 mb-4">
              متأسفانه مشکلی در بارگذاری صفحه رخ داده است.
            </p>
            <div className="space-y-2 mb-4">
              <button 
                onClick={() => window.location.reload()} 
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                بارگذاری مجدد
              </button>
              <button 
                onClick={() => window.location.href = '/'} 
                className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                بازگشت به صفحه اصلی
              </button>
            </div>
            {this.state.error && (
              <details className="text-left text-sm text-gray-500">
                <summary>جزئیات خطا</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;