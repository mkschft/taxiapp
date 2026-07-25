import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { AppButton } from './AppButton';
import { colors, spacing, fontSize, font, radius, shadow } from '../../theme/tokens';

type Variant = 'default' | 'danger' | 'success';

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  buttonLabel: string;
  variant?: Variant;
  onDismiss: () => void;
};

export function AlertDialog({
  visible,
  title,
  message,
  buttonLabel,
  variant = 'default',
  onDismiss,
}: Props) {
  const buttonVariant = variant === 'danger' ? 'danger' : variant === 'success' ? 'success' : 'primary';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable style={[styles.sheet, shadow.md]} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.actions}>
            <AppButton
              label={buttonLabel}
              variant={buttonVariant}
              onPress={onDismiss}
              style={styles.btn}
              labelStyle={styles.btnText}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: fontSize.md, fontFamily: font.bold, color: colors.text },
  message: {
    fontSize: fontSize.sm,
    fontFamily: font.regular,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  actions: {
    marginTop: spacing.md,
  },
  btn: { height: 40 },
  btnText: { fontSize: fontSize.sm },
});
