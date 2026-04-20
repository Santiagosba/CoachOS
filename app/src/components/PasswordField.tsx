import { useState } from 'react'
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type PasswordFieldProps = TextInputProps & {
  containerStyle?: TextInputProps['style']
}

export default function PasswordField({
  containerStyle,
  style,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        {...props}
        style={[styles.input, style]}
        secureTextEntry={!visible}
      />
      <TouchableOpacity
        style={styles.eyeButton}
        onPress={() => setVisible((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color="rgba(160, 185, 230, 0.50)"
        />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
