# Change Patterns i18n System

## Overview

The Change Patterns filtering system uses English strings internally for categorization and filtering, but displays translated values to users. This document explains the translation architecture and how to maintain it.

## Architecture

### Data Flow

```
English JSON Data (internal) → Filter Logic (English) → UI Translation → User Display (localized)
```

**Key Principle:** The filter values in `types.ts` and the JSON data files remain in English. Only the UI display is translated.

### Translation Structure

Filter values are translated using nested keys in `common.json`:

```
patterns.filterValues.{categoryId}.{value}
```

Example:
- English: `patterns.filterValues.levelOfChange.Individual` → "Individual"
- Spanish: `patterns.filterValues.levelOfChange.Individual` → "Individual"
- Hungarian: `patterns.filterValues.levelOfChange.Individual` → "Egyéni"

## Files Involved

### 1. Filter Definitions (`src/app/learn/patterns/types.ts`)

```typescript
export const FILTER_CATEGORIES: Record<string, FilterCategory> = {
  levelOfChange: {
    id: 'levelOfChange',
    label: 'Level of Change',  // English label (used as fallback)
    values: ['Individual', 'Community', 'Institutional', 'Policy', 'Structural', 'Paradigm'],
  },
  // ...
};
```

**Important:** Do NOT translate values here. These English strings are used for:
- JSON data categorization
- Filter matching logic
- Translation key generation

### 2. Locale Files (`src/locales/*/common.json`)

Each locale file must contain:

```json
{
  "patterns": {
    "categoryLabels": {
      "levelOfChange": "Level of Change",  // Category label translation
      "primaryApproach": "Primary Approach",
      // ...
    },
    "filterValues": {
      "levelOfChange": {
        "Individual": "Individual",  // Value translation
        "Community": "Community",
        // ...
      },
      "primaryApproach": {
        "Direct Action": "Direct Action",
        "Economic Pressure": "Economic Pressure",
        // ...
      }
      // ...
    }
  }
}
```

### 3. Client Component (`ChangePatternsClient.tsx`)

The `translateFilterValue` helper function:

```typescript
const translateFilterValue = useCallback((categoryId: string, value: string): string => {
  const key = `patterns.filterValues.${categoryId}.${value}`;
  return t(key, value);  // Fallback to English value if key missing
}, [t]);
```

## Usage in UI

### Filter Buttons

```tsx
{category.values.map(value => (
  <button onClick={() => addFilter(categoryId, value)}>
    {translateFilterValue(categoryId, value)}
  </button>
))}
```

### Active Filter Chips

```tsx
<span className="font-medium">
  {translateFilterValue(filter.categoryId, filter.value)}
</span>
```

### Pattern Cards (levelOfChange badges)

```tsx
{pattern.levelOfChange.split(',').map((level) => (
  <Badge>
    {translateFilterValue('levelOfChange', level.trim())}
  </Badge>
))}
```

## Adding New Filter Values

When adding a new value to `FILTER_CATEGORIES`:

1. Add the English value to `types.ts`:
   ```typescript
   values: [..., 'New Value']
   ```

2. Add translations to ALL THREE locale files:
   - `src/locales/en/common.json`
   - `src/locales/es/common.json`
   - `src/locales/hu/common.json`

   ```json
   "filterValues": {
     "categoryId": {
       "New Value": "Translated New Value"
     }
   }
   ```

3. Test all three languages to ensure translations appear correctly.

## Why Not Translate at Data Level?

Translating at the data level would require:
1. Separate JSON files per language
2. Duplicate filter logic per language
3. Complex i18n key management in categorization functions

The current approach:
- Keeps data source language-agnostic
- Maintains single source of truth for filter logic
- Separates concerns (data vs. presentation)

## Fallback Behavior

If a translation key is missing, `t(key, value)` returns the English value as fallback. This ensures the UI never shows raw translation keys to users.

## Testing

To verify translations:
1. Switch language using the language selector
2. Navigate to `/learn/patterns`
3. Check filter buttons display translated values
4. Apply filters and verify active filter chips show translations
5. Check pattern cards show translated levelOfChange badges
