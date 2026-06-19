import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Pressable,
} from 'react-native';
import {
  FileText, ClipboardList, LayoutGrid, CalendarCheck, Target,
  ShieldCheck, Accessibility, HandHeart, TrafficCone,
  ChevronDown, ChevronUp, CheckCircle2, type LucideIcon,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { AppButton } from '../components/ui/AppButton';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { getGuideSections } from '../data/loaders';
import type { GuideSection, GuideCategoryRule } from '../data/types';

// Map icon string names → lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  FileText, ClipboardList, LayoutGrid, CalendarCheck, Target,
  ShieldCheck, Accessibility, HandHeart, TrafficCone,
};

function SectionIcon({ name, size = 22, color }: { name: string; size?: number; color?: string }) {
  const Icon = ICON_MAP[name] ?? FileText;
  return <Icon size={size} color={color ?? colors.primary} strokeWidth={2} />;
}

// ── Category card (inside the 4-categories section) ──
function CategoryCard({ cat }: { cat: GuideCategoryRule }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      style={styles.catCard}
      onPress={() => setOpen(o => !o)}
    >
      <View style={styles.catHeader}>
        <View style={[styles.catIconChip, { backgroundColor: cat.color + '18' }]}>
          <SectionIcon name={cat.icon} size={20} color={cat.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.catName}>{cat.name}</Text>
          <Text style={styles.catDesc} numberOfLines={open ? undefined : 2}>{cat.description}</Text>
        </View>
        {open
          ? <ChevronUp size={18} color={colors.textSecondary} strokeWidth={2} />
          : <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2} />}
      </View>
      {open && (
        <View style={styles.catRules}>
          {cat.keyRules.map((rule, i) => (
            <View key={i} style={styles.ruleRow}>
              <CheckCircle2 size={14} color={cat.color} strokeWidth={2.4} />
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

// ── Section card (collapsible) ──
function SectionCard({ section }: { section: GuideSection }) {
  const [open, setOpen] = useState(section.id === 'categories');
  const navigation = useNavigation<any>();

  return (
    <View style={styles.sectionCard}>
      <Pressable style={styles.sectionHeader} onPress={() => setOpen(o => !o)}>
        <View style={[styles.sectionIconChip, { backgroundColor: colors.primaryTint }]}>
          <SectionIcon name={section.icon} size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {!open && (
            <Text style={styles.sectionSummaryCollapsed} numberOfLines={1}>
              {section.summary}
            </Text>
          )}
        </View>
        {open
          ? <ChevronUp size={18} color={colors.textSecondary} strokeWidth={2} />
          : <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2} />}
      </Pressable>

      {open && (
        <View style={styles.sectionBody}>
          <Text style={styles.sectionSummary}>{section.summary}</Text>

          {/* Key-value items */}
          {section.items && section.items.map((item, i) => (
            <View key={i} style={[styles.itemRow, i === 0 && styles.itemRowFirst]}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemValue}>{item.value}</Text>
            </View>
          ))}

          {/* Categories */}
          {section.categories && section.categories.map(cat => (
            <CategoryCard key={cat.id} cat={cat} />
          ))}

          {/* Note */}
          {section.note && (
            <View style={styles.note}>
              <Text style={styles.noteText}>{section.note}</Text>
            </View>
          )}

          {/* CTA for clue method section */}
          {section.id === 'clue_method' && (
            <AppButton
              label="Practice clue words →"
              onPress={() => navigation.navigate('Study', {
                screen: 'ClueWords', initial: false, params: {},
              })}
              style={{ marginTop: spacing.md }}
            />
          )}
        </View>
      )}
    </View>
  );
}

// ── Main screen ──
export function GuideScreen() {
  const navigation = useNavigation<any>();
  const sections = getGuideSections();

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Exam Guide" onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero banner */}
        <View style={styles.hero}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle}>Finnish Taxi Exam</Text>
            <Text style={styles.heroSub}>50 questions · 45 min · 38/50 to pass</Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Traficom</Text>
          </View>
        </View>

        {/* Quick stats row */}
        <View style={styles.statsRow}>
          {[
            { val: '50', label: 'Questions' },
            { val: '45', label: 'Minutes' },
            { val: '38/50', label: 'Pass mark' },
            { val: '4', label: 'Categories' },
          ].map(s => (
            <View key={s.label} style={styles.statChip}>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sections}>
          {sections.map(s => <SectionCard key={s.id} section={s} />)}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Source: Traficom (Finnish Transport and Communications Agency).
            Rules may change — always verify at traficom.fi before your exam.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  hero: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    margin: spacing.md, padding: spacing.md,
    backgroundColor: colors.primary, borderRadius: radius.md,
    ...shadow.md,
  },
  heroTextBlock: { flex: 1 },
  heroTitle: { fontSize: fontSize.lg, fontFamily: font.bold, color: '#fff' },
  heroSub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.sm,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  heroBadgeText: { fontSize: fontSize.xs, fontFamily: font.bold, color: '#fff', letterSpacing: 0.5 },

  statsRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: spacing.md, marginBottom: spacing.sm,
  },
  statChip: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border,
    padding: 10, alignItems: 'center',
  },
  statVal: { fontSize: fontSize.lg, fontFamily: font.bold, color: colors.primary },
  statLbl: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },

  sections: { paddingHorizontal: spacing.md, gap: 10 },

  // Section card
  sectionCard: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, overflow: 'hidden',
    ...shadow.sm,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: spacing.md,
  },
  sectionIconChip: {
    width: 40, height: 40, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sectionTitle: { fontSize: 15, fontFamily: font.semibold, color: colors.text },
  sectionSummaryCollapsed: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  sectionBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  sectionSummary: {
    fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20,
    marginBottom: spacing.sm, fontFamily: font.regular,
  },

  // Key-value items
  itemRowFirst: { borderTopWidth: 1, borderTopColor: colors.border },
  itemRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.border, gap: 12,
  },
  itemLabel: { fontSize: fontSize.sm, fontFamily: font.semibold, color: colors.text, flexShrink: 0 },
  itemValue: { fontSize: fontSize.sm, color: colors.textSecondary, flex: 1, textAlign: 'right' },

  // Category cards
  catCard: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: 12, marginBottom: 8,
  },
  catHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  catIconChip: {
    width: 36, height: 36, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  catName: { fontSize: 14, fontFamily: font.semibold, color: colors.text, marginBottom: 2 },
  catDesc: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  catRules: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border, gap: 7 },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  ruleText: { fontSize: 13, color: colors.text, flex: 1, lineHeight: 18 },

  // Note
  note: {
    backgroundColor: colors.warningTint, borderRadius: radius.sm,
    padding: 12, marginTop: spacing.sm,
    borderWidth: 1, borderColor: colors.warning + '55',
  },
  noteText: { fontSize: 13, color: colors.text, lineHeight: 19, fontFamily: font.regular },

  footer: {
    marginHorizontal: spacing.md, marginTop: spacing.lg,
    padding: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  footerText: { fontSize: 11, color: colors.textTertiary, lineHeight: 17, textAlign: 'center' },
});
