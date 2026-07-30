import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from 'twrnc';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error info silently or to telemetry service
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={tw`flex-1 bg-white items-center justify-center p-6 text-center`}>
          <View style={tw`w-20 h-20 rounded-full bg-red-50 items-center justify-center mb-4`}>
            <Text style={tw`text-4xl`}>⚠️</Text>
          </View>
          <Text style={tw`text-[20px] font-black text-gray-900 mb-2`}>Something went wrong</Text>
          <Text style={tw`text-[13px] text-gray-500 font-medium text-center mb-6 leading-relaxed`}>
            An unexpected error occurred. Please restart the app or tap below to retry.
          </Text>
          <TouchableOpacity
            onPress={this.handleReset}
            style={[tw`px-6 py-3.5 rounded-2xl shadow-md`, { backgroundColor: '#8fda58' }]}
          >
            <Text style={tw`text-white font-black text-[14px]`}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
