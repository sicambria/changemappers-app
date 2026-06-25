'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { AlertTriangleIcon, PlusIcon, XIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import type { CityAutocompleteValue } from '@/components/ui/CityAutocomplete';
import { createSocialIssue, updateSocialIssue } from '@/app/actions/social-issue';
import type { SocialIssueCategory } from '@/types/social-issue';
import { useValidationErrors } from '@/hooks/useValidationErrors';
import { CommonsLicenseNotice } from '@/components/shared/CommonsLicenseNotice';
import {
	LEAN_8_WASTES,
	RDG_OPTIONS,
	SCOPE_OPTIONS,
	CATEGORIES,
	SEVERITY_LEVELS,
	SEVERITY_COLORS,
} from './socialIssue.config';
import type { SocialIssueFormInitialData } from './socialIssue.config';
import { HarmTypesSelector } from './HarmTypesSelector';

export type { SocialIssueFormInitialData } from './socialIssue.config';

interface SocialIssueFormProps {
	initialData?: SocialIssueFormInitialData;
	issueId?: string;
}

export function SocialIssueForm({ initialData, issueId }: SocialIssueFormProps = {}) {
  const isEdit = Boolean(issueId);
  const { t } = useTranslation('social-issues');
  const router = useRouter();
  const { formError, setErrors, clearErrors } = useValidationErrors();
  const [saving, setSaving] = useState(false);
  const [showRdgList, setShowRdgList] = useState(false);
  const [showLeanWastes, setShowLeanWastes] = useState(false);
  const [showHarmTypes, setShowHarmTypes] = useState(false);

	const [form, setForm] = useState({
		title: initialData?.title ?? '',
		description: initialData?.description ?? '',
		category: (initialData?.category ?? ''),
		severity: (initialData?.severity ?? 'MODERATE'),
		scope: (initialData?.scope ?? ''),
		isLocalizable: initialData?.isLocalizable ?? true,
		locationName: initialData?.locationName ?? '',
		latitude: initialData?.latitude,
		longitude: initialData?.longitude,
		relatedRdgs: initialData?.relatedRdgs ?? [] as number[],
		leanWastes: initialData?.leanWastes ?? [] as string[],
		harmTypes: initialData?.harmTypes ?? [] as string[],
		sources: initialData?.sources ?? [] as string[],
		tags: initialData?.tags ?? [] as string[],
	});

const [newSource, setNewSource] = useState('');
  const [newTag, setNewTag] = useState('');

const [cityValue, setCityValue] = useState<CityAutocompleteValue>(
    initialData?.locationName
      ? { name: initialData.locationName, country: '', lat: initialData.latitude || 0, lng: initialData.longitude || 0 }
      : null
  );

const toggleRdg = (rdg: number) => {
		setForm((f) => ({
			...f,
			relatedRdgs: f.relatedRdgs.includes(rdg) ? f.relatedRdgs.filter((r) => r !== rdg) : [...f.relatedRdgs, rdg],
		}));
	};

	const toggleLeanWaste = (waste: string) => {
		setForm((f) => ({
			...f,
			leanWastes: f.leanWastes.includes(waste)
				? f.leanWastes.filter((w) => w !== waste)
				: [...f.leanWastes, waste],
		}));
	};

	const toggleHarmType = (harm: string) => {
		setForm((f) => ({
			...f,
			harmTypes: f.harmTypes.includes(harm)
				? f.harmTypes.filter((h) => h !== harm)
				: [...f.harmTypes, harm],
		}));
	};

	const addSource = () => {
		if (newSource?.startsWith('http')) {
			setForm((f) => ({ ...f, sources: [...f.sources, newSource] }));
			setNewSource('');
		}
	};

	const addTag = () => {
		if (newTag && !form.tags.includes(newTag)) {
			setForm((f) => ({ ...f, tags: [...f.tags, newTag] }));
			setNewTag('');
		}
	};

	const removeSource = (src: string) => {
		setForm((f) => ({ ...f, sources: f.sources.filter((s) => s !== src) }));
	};

	const removeTag = (tag: string) => {
		setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
	};

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
clearErrors();

if (!form.title.trim()) {
setErrors({ success: false, error: t('errors.titleRequired') });
return;
}
if (!form.category) {
setErrors({ success: false, error: t('errors.categoryRequired') });
return;
}
if (form.relatedRdgs.length === 0) {
setErrors({ success: false, error: t('form.rdgHint') });
return;
}
if (form.isLocalizable && (!cityValue?.lat || !cityValue?.lng)) {
setErrors({ success: false, error: t('errors.locationSelectionRequired') });
return;
}

		setSaving(true);
		try {
			const payload = {
				title: form.title,
				description: form.description || undefined,
				category: form.category,
				severity: form.severity,
				scope: form.scope || undefined,
isLocalizable: form.isLocalizable,
      locationName: cityValue?.name || undefined,
      latitude: cityValue?.lat,
      longitude: cityValue?.lng,
				relatedRdgs: form.relatedRdgs.map(String),
				leanWastes: [...form.leanWastes, ...form.harmTypes],
				sources: form.sources,
				tags: form.tags,
			};

			const result = isEdit && issueId
				? await updateSocialIssue(issueId, payload)
				: await createSocialIssue(payload);

if (result.success && result.data) {
router.push(`/social-issues/${result.data.id}`);
} else {
setErrors(result);
}
} catch (err) {
console.error(isEdit ? 'Error updating issue:' : 'Error creating issue:', err);
setErrors({ success: false, error: isEdit ? t('errors.updateFailed') : t('errors.createFailed') });
} finally {
setSaving(false);
}
};

	return (
		<Card className="max-w-3xl mx-auto p-6">
			<div className="flex items-center gap-3 mb-6">
				<div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/50">
					<AlertTriangleIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
				</div>
				<div>
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isEdit ? t('edit') : t('create')}</h1>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
						{t('form.descriptionIntro')}
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				<CommonsLicenseNotice />

				{/* Title */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						{t('form.title')} <span className="text-red-500">*</span>
					</label>
					<input
						type="text"
						value={form.title}
						onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
						className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
						placeholder={t('form.titlePlaceholder')}
						maxLength={200}
						required
					/>
				</div>

				{/* Description */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						{t('form.description')}
					</label>
					<textarea
						value={form.description}
						onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
						className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
						placeholder={t('form.descriptionPlaceholder')}
						rows={4}
						maxLength={5000}
					/>
				</div>

				{/* Category + Severity */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							{t('form.category')} <span className="text-red-500">*</span>
						</label>
						<select
							value={form.category}
							onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as SocialIssueCategory }))}
							className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
							required
						>
							<option value="">{t('form.selectCategory')}</option>
							{CATEGORIES.map((cat) => (
								<option key={cat} value={cat}>
									{t(`categories.${cat}`)}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							{t('form.severity')}
						</label>
						<div className="flex gap-2 flex-wrap">
							{SEVERITY_LEVELS.map((sev) => (
								<button
									key={sev}
									type="button"
									onClick={() => setForm((f) => ({ ...f, severity: sev }))}
									className={`px-3 py-1.5 text-xs font-medium rounded-lg border-2 transition ${
										form.severity === sev
											? SEVERITY_COLORS[sev]
											: 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 hover:border-gray-400'
									}`}
								>
									{t(`severity.${sev}`)}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Scope */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						{t('form.scope')}
					</label>
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => setForm((f) => ({ ...f, scope: '' }))}
							className={`px-3 py-1.5 text-xs rounded-lg border transition ${
								form.scope === ''
									? 'bg-cyan-100 border-cyan-400 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300'
									: 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 hover:border-cyan-300'
							}`}
						>
							{t('form.selectScope')}
						</button>
						{SCOPE_OPTIONS.map((scope) => (
							<button
								key={scope}
								type="button"
								onClick={() => setForm((f) => ({ ...f, scope }))}
								className={`px-3 py-1.5 text-xs rounded-lg border transition ${
									form.scope === scope
										? 'bg-cyan-100 border-cyan-400 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300'
										: 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 hover:border-cyan-300'
								}`}
							>
								{t(`scope.${scope}`)}
							</button>
						))}
					</div>
				</div>

				{/* RDG Alignment */}
				<div>
					<div className="flex items-center justify-between mb-1">
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
							{t('form.rdgRequired')} <span className="text-red-500">*</span>
						</label>
						{form.relatedRdgs.length > 0 && (
							<span className="text-xs text-emerald-600 font-medium">
								{t('form.selectedCount', { count: form.relatedRdgs.length })}
							</span>
						)}
					</div>
					<p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t('form.rdgHint')}</p>

					<button
						type="button"
						onClick={() => setShowRdgList(!showRdgList)}
						className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 font-medium mb-3 hover:underline"
					>
						{showRdgList ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
						{showRdgList ? t('form.hideRdgList') : t('form.browseRdgList')}
					</button>

					{showRdgList && (
						<div className="mb-3 space-y-1.5 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
							{RDG_OPTIONS.map((rdg) => (
								<label key={rdg} className="flex items-start gap-3 cursor-pointer group py-1 px-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition">
									<input
										type="checkbox"
										checked={form.relatedRdgs.includes(rdg)}
										onChange={() => toggleRdg(rdg)}
										className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 flex-shrink-0"
									/>
									<span className={`text-xs leading-relaxed ${form.relatedRdgs.includes(rdg) ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
										{t(`rdgs.${rdg}`)}
									</span>
								</label>
							))}
						</div>
					)}

					<div className="flex flex-wrap gap-1.5">
						{RDG_OPTIONS.map((rdg) => (
							<button
								key={rdg}
								type="button"
								title={t(`rdgs.${rdg}`)}
								onClick={() => toggleRdg(rdg)}
								className={`px-2.5 py-1 text-xs rounded-full border transition font-medium ${
									form.relatedRdgs.includes(rdg)
										? 'bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
										: 'bg-gray-100 border-gray-300 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 hover:border-emerald-400'
								}`}
							>
								{rdg}
							</button>
						))}
					</div>

					{form.relatedRdgs.length > 0 && (
						<div className="mt-3 space-y-1">
							{form.relatedRdgs.toSorted((a, b) => a - b).map((rdg) => (
								<div key={rdg} className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
									<span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">{rdg}</span>
									{t(`rdgs.${rdg}`)}
								</div>
							))}
						</div>
					)}
				</div>

				{/* Location */}
				<div className="border-t border-gray-200 dark:border-gray-700 pt-6">
					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							checked={form.isLocalizable}
							onChange={(e) => setForm((f) => ({ ...f, isLocalizable: e.target.checked }))}
							className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
						/>
						<span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.isLocalizable')}</span>
					</label>
					<p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">{t('form.isLocalizableHint')}</p>

{form.isLocalizable && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('form.location')}
            </label>
            <CityAutocomplete
              value={cityValue}
              onChange={setCityValue}
              placeholder={t('form.locationSearchPlaceholder')}
            />
          </div>
        )}
				</div>

				{/* Types of Industrial & Infrastructure Harm */}
				<HarmTypesSelector
					value={form.harmTypes}
					onChange={toggleHarmType}
					showHarmTypes={showHarmTypes}
					setShowHarmTypes={setShowHarmTypes}
				/>

				{/* Lean 8 Waste Analysis — collapsible */}
				<div className="border-t border-gray-200 dark:border-gray-700 pt-6">
					<button
						type="button"
						onClick={() => setShowLeanWastes(!showLeanWastes)}
						className="flex items-center justify-between w-full text-left group"
					>
						<div>
							<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
								{t('leanWastes.title')}
								{form.leanWastes.length > 0 && (
									<span className="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">
										{form.leanWastes.length} selected
									</span>
								)}
							</span>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('leanWastes.hint')}</p>
						</div>
						{showLeanWastes
							? <ChevronUpIcon className="h-4 w-4 text-gray-400 flex-shrink-0 ml-3" />
							: <ChevronDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0 ml-3" />
						}
					</button>

					{showLeanWastes && (
						<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
							{LEAN_8_WASTES.map((waste) => (
								<label
									key={waste}
									className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition ${
										form.leanWastes.includes(waste)
											? 'bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-600'
											: 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-amber-300'
									}`}
								>
									<input
										type="checkbox"
										checked={form.leanWastes.includes(waste)}
										onChange={() => toggleLeanWaste(waste)}
										className="mt-0.5 w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 flex-shrink-0"
									/>
									<span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
										{t(`leanWastes.${waste}`)}
									</span>
								</label>
							))}
						</div>
					)}
				</div>

				{/* Sources */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						{t('form.sources')}
					</label>
					<p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('form.sourcesHint')}</p>
					<div className="flex gap-2 mb-2">
						<input
							type="url"
							value={newSource}
							onChange={(e) => setNewSource(e.target.value)}
							className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
							placeholder={t('form.sourcesPlaceholder')}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									addSource();
								}
							}}
						/>
						<Button type="button" variant="secondary" size="sm" onClick={addSource}>
							<PlusIcon className="h-4 w-4" />
						</Button>
					</div>
					{form.sources.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{form.sources.map((src) => (
								<span
									key={src}
									className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs"
								>
									<a href={src} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline truncate max-w-[200px]">
										{src}
									</a>
									<button
										type="button"
										onClick={() => removeSource(src)}
										className="text-gray-400 hover:text-red-500"
									>
										<XIcon className="h-3 w-3" />
									</button>
								</span>
							))}
						</div>
					)}
				</div>

				{/* Tags */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						{t('form.tags')}
					</label>
					<div className="flex gap-2 mb-2">
						<input
							type="text"
							value={newTag}
							onChange={(e) => setNewTag(e.target.value)}
							className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
							placeholder={t('form.tagsPlaceholder')}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									addTag();
								}
							}}
						/>
						<Button type="button" variant="secondary" size="sm" onClick={addTag}>
							<PlusIcon className="h-4 w-4" />
						</Button>
					</div>
					{form.tags.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{form.tags.map((tag) => (
								<span
									key={tag}
									className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded text-xs text-emerald-700 dark:text-emerald-300"
								>
									#{tag}
									<button
										type="button"
										onClick={() => removeTag(tag)}
										className="hover:text-red-500"
									>
										<XIcon className="h-3 w-3" />
									</button>
								</span>
							))}
						</div>
					)}
				</div>

    {formError && (
    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
    <AlertTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
    {formError}
    </div>
    )}

				<div className="flex gap-3 pt-4">
					<Button type="submit" variant="primary" disabled={saving}>
						{(() => {
							if (saving) return t('form.submitting');
							if (isEdit) return t('form.update');
							return t('form.submit');
						})()}
					</Button>
					<Button type="button" variant="secondary" onClick={() => router.back()}>
						{t('form.cancel')}
					</Button>
				</div>
			</form>
		</Card>
	);
}
