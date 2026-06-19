import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, fontSize } from '../../theme/tokens';

/* ── Question tariff tables ──────────────────────────────────────────────────
 * A few questions reference an "attached price list" the candidate must read to
 * compute a fare. Rendering it as a real table (not an image) keeps the numbers
 * crisp, exact, and consistent with the answer key — and it's rebuild-safe like
 * QuestionImage (kept here, not in the regenerated JSON). Keyed by question id.
 *
 * The rates below are an ILLUSTRATIVE example tariff (not official Traficom
 * pricing). They are designed so a 20 km / 30 min single-passenger Sunday ride
 * totals exactly €65.00, matching the correct answer for Q149 / MTQ-064:
 *   base 9.00 + 20 km × 2.50 (=50.00) + 30 min × 0.20 (=6.00) = 65.00
 */

type Tariff = {
  caption: string;
  columns: string[];          // e.g. ['Mon–Sat', 'Sun & holidays']
  rows: { label: string; values: string[] }[];
  footnote: string;
};

const TAXI_TARIFF: Tariff = {
  caption: 'Example taxi tariff (illustrative)',
  columns: ['Mon–Sat', 'Sun & holidays'],
  rows: [
    { label: 'Base fare (perusmaksu)', values: ['€7.00', '€9.00'] },
    { label: 'Per kilometre', values: ['€2.50', '€2.50'] },
    { label: 'Per minute', values: ['€0.20', '€0.20'] },
  ],
  footnote: 'VAT included · single passenger · no fixed price agreed',
};

const QUESTION_TARIFFS: Record<string, Tariff> = {
  Q149: TAXI_TARIFF,
  'MTQ-064': TAXI_TARIFF,
};

export function hasQuestionTariff(id: string): boolean {
  return id in QUESTION_TARIFFS;
}

/** Renders the question's price list as a table, or nothing if none is registered. */
export function QuestionTariff({ id }: { id: string }) {
  const tariff = QUESTION_TARIFFS[id];
  if (!tariff) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.caption}>{tariff.caption}</Text>

      {/* Header row */}
      <View style={[styles.row, styles.headRow]}>
        <Text style={[styles.cell, styles.cellLabel, styles.headText]}> </Text>
        {tariff.columns.map((c) => (
          <Text key={c} style={[styles.cell, styles.headText]}>{c}</Text>
        ))}
      </View>

      {/* Data rows */}
      {tariff.rows.map((r) => (
        <View key={r.label} style={styles.row}>
          <Text style={[styles.cell, styles.cellLabel]}>{r.label}</Text>
          {r.values.map((v, i) => (
            <Text key={i} style={[styles.cell, styles.value]}>{v}</Text>
          ))}
        </View>
      ))}

      <Text style={styles.footnote}>{tariff.footnote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  caption: {
    fontSize: fontSize.xs,
    fontFamily: font.bold,
    color: colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  headRow: { borderTopWidth: 0 },
  cell: { flex: 1, fontSize: fontSize.sm, color: colors.text, textAlign: 'right' },
  cellLabel: { flex: 1.6, textAlign: 'left', color: colors.textSecondary },
  headText: { fontFamily: font.semibold, color: colors.text },
  value: { fontFamily: font.semibold },
  footnote: {
    marginTop: spacing.sm,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
});
