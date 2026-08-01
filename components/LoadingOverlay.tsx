import React from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import tw from 'twrnc'
import Svg, { Circle, Path } from 'react-native-svg'

interface LoadingOverlayProps {
  visible?: boolean
  message?: string
}

function VaayuLogoIcon() {
  return (
    <Svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill="#8fda58" opacity="0.2" />
      <Path d="M7 13l3 3 7-7" stroke="#8fda58" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function LoadingOverlay({ visible = true, message = "Loading VAAYU..." }: LoadingOverlayProps) {
  if (!visible) return null

  return (
    <View style={[StyleSheet.absoluteFill, tw`z-50 bg-white/95 items-center justify-center p-6`]}>
      <View style={tw`items-center justify-center gap-4 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl max-w-[280px] w-full`}>
        <View style={tw`w-16 h-16 rounded-full bg-green-50 items-center justify-center`}>
          <VaayuLogoIcon />
        </View>
        <ActivityIndicator size="large" color="#8fda58" />
        <Text style={tw`text-[14px] font-black text-gray-800 text-center tracking-wide mt-1`}>
          {message}
        </Text>
      </View>
    </View>
  )
}
