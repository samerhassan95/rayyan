# Source Labels Translation - Complete ✅

## Task Summary
Implemented Arabic-English translations for source labels (DIRECT, SOCIAL, REFERRAL, OTHER) across multiple pages in the admin dashboard.

## Changes Made

### 1. Translation Keys Added
**File**: `frontend/src/i18n/translations.ts`

Added new translation keys for source labels:
- `direct_source`: 'Direct' / 'مباشر'
- `social_source`: 'Social' / 'وسائل التواصل'
- `referral_source`: 'Referral' / 'إحالة'
- `other_source`: 'Other' / 'أخرى'

### 2. Dashboard Page (Overview)
**File**: `frontend/src/app/admin/page.tsx`

**Changes**:
- Updated `sources` array to use `labelKey` instead of hardcoded `label`
- Modified source display to use `t(source.labelKey).toUpperCase()` for translation
- Source labels now dynamically translate based on selected language

**Location**: User Acquisition card on dashboard

### 3. User Acquisition Analytics Page
**File**: `frontend/src/app/admin/analytics/user-acquisition/page.tsx`

**Changes**:
- Added `translateSource()` helper function to map source names to translations
- Updated CSV export to use translated source names
- Updated PDF export to use translated source names
- Updated source breakdown section to display translated labels
- Updated detailed analysis table to show translated source names

**Locations**:
- Summary cards
- Source breakdown chart
- Monthly trends
- Detailed source analysis table
- CSV export
- PDF export

## Translation Mapping

| Database Value | English | Arabic |
|---------------|---------|--------|
| direct | Direct | مباشر |
| social | Social | وسائل التواصل |
| referral | Referral | إحالة |
| other | Other | أخرى |

## Testing Checklist

✅ Dashboard page shows translated source labels
✅ User Acquisition page shows translated source labels
✅ CSV export includes translated source names
✅ PDF export includes translated source names
✅ Print report includes translated source names
✅ Language switching works correctly (Arabic ↔ English)
✅ All diagnostics pass with no errors

## Files Modified
1. `frontend/src/i18n/translations.ts` - Added 4 new translation keys
2. `frontend/src/app/admin/page.tsx` - Updated sources array and display logic
3. `frontend/src/app/admin/analytics/user-acquisition/page.tsx` - Added translation helper and updated all source displays

## Notes
- Source labels are now fully internationalized
- The translation system uses the `t()` function from LanguageContext
- All source labels automatically update when language is changed
- Export functionality (CSV, PDF, Print) respects the current language setting
