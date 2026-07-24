import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import tw from 'twrnc';

interface PermissionPrePromptModalProps {
  visible: boolean;
  onAllow: () => void;
  onSkip: () => void;
}

export function PermissionPrePromptModal({ visible, onAllow, onSkip }: PermissionPrePromptModalProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={tw`flex-1 bg-black/60 items-center justify-center p-5 z-50`}>
        <View style={tw`bg-white rounded-3xl p-6 w-full max-w-sm gap-4 items-center shadow-2xl`}>
          <View style={tw`w-16 h-16 rounded-full bg-green-100 items-center justify-center`}>
            <Text style={tw`text-3xl`}>🔔</Text>
          </View>

          <Text style={tw`text-[20px] font-black text-gray-900 text-center leading-tight`}>
            Stay Updated on Your Orders
          </Text>

          <Text style={tw`text-[13px] text-gray-600 font-medium text-center leading-relaxed`}>
            Vaayu needs notification permissions to send real-time alerts when your order is accepted, prepared, and out for delivery.
          </Text>

          <View style={tw`w-full gap-2.5 mt-2`}>
            <TouchableOpacity
              onPress={onAllow}
              style={tw`w-full h-13 bg-[#1a3a2a] rounded-2xl items-center justify-center shadow-md active:scale-95`}
            >
              <Text style={tw`text-white font-black text-[15px]`}>ENABLE NOTIFICATIONS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onSkip}
              style={tw`w-full h-11 items-center justify-center active:scale-95`}
            >
              <Text style={tw`text-gray-500 font-bold text-[13px]`}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
