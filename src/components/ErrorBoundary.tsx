import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 你同样可以将错误日志上报给服务器
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // 你可以自定义降级后的 UI 并渲染
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-red-600 mb-2">⚠️ 页面出错了</h1>
              <p className="text-gray-600">抱歉，页面遇到了一个错误。请刷新页面重试。</p>
            </div>
            
            <div className="mb-6">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                🔄 刷新页面
              </button>
            </div>

            <div className="mb-4">
              <button
                onClick={() => window.location.href = window.location.origin}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                🏠 返回首页
              </button>
            </div>

            {/* 开发环境下显示错误详情 */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 bg-gray-50 p-4 rounded-lg">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  🔍 错误详情 (开发模式)
                </summary>
                <div className="text-sm text-gray-600 space-y-2">
                  <div>
                    <strong>错误信息:</strong>
                    <pre className="bg-red-50 p-2 rounded mt-1 text-red-700 overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </div>
                  <div>
                    <strong>错误堆栈:</strong>
                    <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-auto max-h-40">
                      {this.state.error.stack}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>组件堆栈:</strong>
                      <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
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
