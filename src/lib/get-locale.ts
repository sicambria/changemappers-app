import { cookies, headers } from 'next/headers'
import { getCurrentUserData } from './get-current-user'

export type SupportedLanguage = 'en' | 'hu' | 'es'
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'hu', 'es']

/**
* Determines the best locale for the current request.
* Priority:
* 1. Authenticated user's preference (stored in DB)
* 2. Cookie 'cm_ui_language' (for guests/override)
* 3. Accept-Language header (browser default)
* 4. Default to 'en'
*/
export async function getLocale(): Promise<SupportedLanguage> {
    try {
        // 1. Check Authenticated User
        const userRes = await getCurrentUserData()
        if (userRes.success && userRes.data?.user?.uiLanguage) {
            const lang = userRes.data.user.uiLanguage as SupportedLanguage
            if (SUPPORTED_LANGUAGES.includes(lang)) return lang
        }

        // 2. Check Cookie
        const cookieStore = await cookies()
        const cookieLang = cookieStore.get('cm_ui_language')?.value as SupportedLanguage
        if (cookieLang && SUPPORTED_LANGUAGES.includes(cookieLang)) {
            return cookieLang
        }

        // 3. Check Accept-Language header
        const headerList = await headers()
        const acceptLang = headerList.get('accept-language')
        if (acceptLang) {
            const primary = acceptLang.split(',')[0].split('-')[0].toLowerCase() as SupportedLanguage
            if (SUPPORTED_LANGUAGES.includes(primary)) return primary
        }
    } catch (e) {
        if (e && typeof e === 'object' && 'digest' in e && e.digest === 'DYNAMIC_SERVER_USAGE') {
            throw e
        }
        console.error('[getLocale] Unexpected error:', e)
    }

// 4. Default
  return 'en'
}
