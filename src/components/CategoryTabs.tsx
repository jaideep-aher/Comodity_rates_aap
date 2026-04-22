import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, font, radius, spacing } from '../theme';
import type { Category } from '../types';
import { useDict } from '../store/settingsStore';

type Props = {
  value: Category;
  onChange: (c: Category) => void;
};

export function CategoryTabs({ value, onChange }: Props) {
  const t = useDict();
  const items: { key: Category; label: string }[] = [
    { key: 'veg', label: t.catVeg },
    { key: 'fruit', label: t.catFruit },
    { key: 'grain', label: t.catGrain },
    { key: 'turbhe', label: t.catTurbhe },
  ];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.wrap}
      keyboardShouldPersistTaps="handled"
    >
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Pressable
            key={it.key}
            onPress={() => onChange(it.key)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{it.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Horizontal ScrollView must not grow with the parent flex column, or its row
  // children stretch on the cross axis and pills look huge / empty.
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    paddingRight: spacing.xl,
    gap: spacing.sm,
  },
  tab: {
    flexShrink: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: { fontSize: font.sm, color: colors.text, fontWeight: '600' },
  labelActive: { color: '#fff' },
});
