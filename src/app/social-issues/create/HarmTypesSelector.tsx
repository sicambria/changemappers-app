'use client';

import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { HARM_TYPE_GROUPS } from './socialIssue.config';

export interface HarmTypesSelectorProps {
	value: string[];
	onChange: (harm: string) => void;
	showHarmTypes: boolean;
	setShowHarmTypes: (show: boolean) => void;
}

export function HarmTypesSelector({
	value,
	onChange,
	showHarmTypes,
	setShowHarmTypes,
}: Readonly<HarmTypesSelectorProps>) {
	const { t } = useTranslation('social-issues');

	return (
		<div className="border-t border-gray-200 dark:border-gray-700 pt-6">
			<button
				type="button"
				onClick={() => setShowHarmTypes(!showHarmTypes)}
				className="flex items-center justify-between w-full text-left group"
			>
				<div>
					<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
						{t('harmTypes.title')}
						{value.length > 0 && (
							<span className="ml-2 text-xs font-normal text-rose-600 dark:text-rose-400">
								{value.length} selected
							</span>
						)}
					</span>
					<p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('harmTypes.hint')}</p>
				</div>
				{showHarmTypes
					? <ChevronUpIcon className="h-4 w-4 text-gray-400 flex-shrink-0 ml-3" />
					: <ChevronDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0 ml-3" />
				}
			</button>

			{showHarmTypes && (
				<div className="mt-4 space-y-5">
					{HARM_TYPE_GROUPS.map((group) => (
						<div key={group.id}>
							<h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
								{t(`harmTypes.groups.${group.id}`)}
							</h4>
							<div className="grid grid-cols-1 gap-1.5">
								{group.items.map((harm) => (
									<label
										key={harm}
										className={`flex items-start gap-3 cursor-pointer p-2.5 rounded-lg border transition ${
											value.includes(harm)
												? 'bg-rose-50 border-rose-300 dark:bg-rose-900/20 dark:border-rose-600'
												: 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-rose-200'
										}`}
									>
										<input
											type="checkbox"
											checked={value.includes(harm)}
											onChange={() => onChange(harm)}
											className="mt-0.5 w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500 flex-shrink-0"
										/>
										<span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
											{t(`harmTypes.${harm}`)}
										</span>
									</label>
								))}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
