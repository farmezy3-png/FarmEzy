import React from "react";
import { Pressable, Text, View } from "react-native";

type RadioButtonProps = {
  label: string;
  value: string | number;
  selected: string | number;
  onPress: (value: string | number) => void;
};

export default function RadioButton({ label, value, selected, onPress }: RadioButtonProps) {
  return (
    <Pressable
      onPress={() => onPress(value)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 6,
        marginRight: 15,
      }}
    >
      {/* Outer circle */}
      <View
        style={{
          height: 20,
          width: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: "#FF8F00", // Indigo-600
          alignItems: "center",
          justifyContent: "center",
          marginRight: 10,
        }}
      >
        {/* Inner circle when selected */}
        {selected === value && (
          <View
            style={{
              height: 10,
              width: 10,
              borderRadius: 5,
              backgroundColor: "#FF8F00",
            }}
          />
        )}
      </View>
      <Text style={{ fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}
