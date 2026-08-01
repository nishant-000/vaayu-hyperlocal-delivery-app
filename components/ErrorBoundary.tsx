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
          <Text style={tw`text-[22px] font-black text-gray-900 mb-2`}>Refreshing App...</Text>
          <Text style={tw`text-[13px] text-gray-500 font-medium text-center mb-6 leading-relaxed px-4`}>
            Tap below to reload VAAYU and return to your screen.
          </Text>
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
