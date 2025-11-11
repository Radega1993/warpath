import React, { Component, ErrorInfo, ReactNode } from 'react';
// @ts-ignore - Resuelto por alias en vite.config.ts
import * as Sentry from '@sentry/react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary para capturar errores de React y enviarlos a Sentry
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Capturar error en Sentry
        Sentry.captureException(error, {
            contexts: {
                react: {
                    componentStack: errorInfo.componentStack,
                },
            },
        });

        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // Renderizar fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">
                    <div className="text-center p-8">
                        <h1 className="text-4xl font-bold text-red-500 mb-4">⚠️ Error</h1>
                        <p className="text-xl mb-4">Algo salió mal</p>
                        <p className="text-gray-400 mb-6">
                            {this.state.error?.message || 'Ha ocurrido un error inesperado'}
                        </p>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.reload();
                            }}
                            className="px-6 py-3 bg-[#00d4ff] text-[#0a0a0f] rounded-lg font-semibold hover:bg-[#00b8e6] transition-colors"
                        >
                            Recargar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

