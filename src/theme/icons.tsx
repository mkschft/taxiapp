import React from 'react';
import {
  ShieldCheck, Accessibility, HandHeart, TrafficCone,
  BookOpen, Target, MessageSquare, Timer, BarChart3,
  Type, ClipboardList, HelpCircle, Link2, Plus, Minus,
  Languages, Bell, CreditCard, Gift, Star, Trash2, CalendarDays,
  type LucideIcon,
} from 'lucide-react-native';
import { colors } from './tokens';

// Map official category IDs → lucide icons (replaces emoji in categories.json)
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  passenger_safety: ShieldCheck,
  special_needs: Accessibility,
  customer_service: HandHeart,
  traffic_safety: TrafficCone,
};

export function CategoryIcon({ id, size = 24, color }: { id: string; size?: number; color?: string }) {
  const Icon = CATEGORY_ICONS[id] ?? Target;
  return <Icon size={size} color={color ?? colors.primary} strokeWidth={2} />;
}

// Clue group → icon
const CLUE_GROUP_ICONS: Record<string, LucideIcon> = {
  positive: Plus,
  negative: Minus,
  wh: HelpCircle,
  conjunction: Link2,
};

export function ClueGroupIcon({ group, size = 16, color }: { group: string; size?: number; color?: string }) {
  const Icon = CLUE_GROUP_ICONS[group] ?? Target;
  return <Icon size={size} color={color ?? colors.textSecondary} strokeWidth={2.4} />;
}

// Re-export commonly used icons so screens import from one place
export {
  BookOpen, Target, MessageSquare, Timer, BarChart3,
  Type, ClipboardList, Languages, Bell, CreditCard, Gift, Star,
  Trash2, CalendarDays, HelpCircle,
};
