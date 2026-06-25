import { Heart, Zap, Users, Target, Sparkles, Globe, ArrowRight } from 'lucide-react';

// Categories mapping to icons and colors
export const CATEGORIES = [
  { id: 'health', icon: <Heart className="h-6 w-6" />, color: '#10b981' },
  { id: 'relationships', icon: <Users className="h-6 w-6" />, color: '#ef4444' },
  { id: 'career', icon: <Target className="h-6 w-6" />, color: '#3b82f6' },
  { id: 'growth', icon: <Sparkles className="h-6 w-6" />, color: '#8b5cf6' },
  { id: 'joy', icon: <Zap className="h-6 w-6" />, color: '#f59e0b' },
  { id: 'meaning', icon: <Globe className="h-6 w-6" />, color: '#06b6d4' },
  { id: 'contribution', icon: <Heart className="h-6 w-6" />, color: '#ec4899' },
  { id: 'freedom', icon: <ArrowRight className="h-6 w-6" />, color: '#14b8a6' }
];

export const LIFE_EXPECTANCY = { male: 73.5, female: 79.8 };
export const CURRENT_YEAR = new Date().getFullYear();
