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
    console.warn('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={tw`flex-1 bg-white items-center justify-center p-6 text-center`}>
          <View style={tw`w-20 h-20 rounded-full bg-green-50 items-center justify-center mb-4 border border-green-100`}>
            <Text style={tw`text-4xl`}>⚡</Text>
          </View>
          <Text style={tw`text-[22px] font-black text-gray-900 mb-1`}>Something went wrong</Text>
          <Text style={tw`text-[13px] text-gray-500 font-medium text-center mb-3 leading-relaxed px-4`}>
            An error occurred while loading this view. Tap below to reload.
          </Text>
          {this.state.error?.message && (
            <View style={tw`bg-gray-100 rounded-xl p-3 mb-6 max-w-[280px] border border-gray-200`}>
              <Text style={tw`text-[11px] font-mono text-red-600 text-center`}>
                {this.state.error.message}
              </Text>
            </View>
          )}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={this.handleReset}
            style={[tw`w-full max-w-[240px] py-4 rounded-2xl items-center shadow-md active:scale-95`, { backgroundColor: '#8fda58' }]}
          >
            <Text style={tw`text-white font-black text-[15px]`}>Reload App</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
