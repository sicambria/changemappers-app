'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { saveProjectReflection } from '@/app/actions/reflection';
import { Button, Input } from '@/components/ui';
import { ArrowLeftIcon, ArrowRightIcon, LockIcon } from 'lucide-react';

function FunctionToggle({ selected, onChange, label, t }: Readonly<{ selected: string[]; onChange: (v: string[]) => void; label: string; t: (key: string) => string }>) {
  const COMMON_FUNCTIONS = [
    { key: 'vision_setting', labelKey: 'project.functionLabels.vision_setting' },
    { key: 'facilitation', labelKey: 'project.functionLabels.facilitation' },
    { key: 'project_management', labelKey: 'project.functionLabels.project_management' },
    { key: 'writing', labelKey: 'project.functionLabels.writing' },
    { key: 'research', labelKey: 'project.functionLabels.research' },
    { key: 'coding', labelKey: 'project.functionLabels.coding' },
    { key: 'design', labelKey: 'project.functionLabels.design' },
    { key: 'fundraising', labelKey: 'project.functionLabels.fundraising' },
    { key: 'network_weaving', labelKey: 'project.functionLabels.network_weaving' },
    { key: 'strategic_thinking', labelKey: 'project.functionLabels.strategic_thinking' },
    { key: 'storytelling', labelKey: 'project.functionLabels.storytelling' },
    { key: 'coordination', labelKey: 'project.functionLabels.coordination' },
    { key: 'holding_space', labelKey: 'project.functionLabels.holding_space' },
    { key: 'data_analysis', labelKey: 'project.functionLabels.data_analysis' },
    { key: 'listening', labelKey: 'project.functionLabels.listening' },
    { key: 'teaching', labelKey: 'project.functionLabels.teaching' },
  ];

  const toggle = (key: string) => onChange(selected.includes(key) ? selected.filter(x => x !== key) : [...selected, key]);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {COMMON_FUNCTIONS.map(f => (
          <button key={f.key} type="button" onClick={() => toggle(f.key)}
            className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${selected.includes(f.key)
              ? 'bg-emerald-100 border-emerald-500 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700'
            }`}>
            {t(f.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ProjectReflectionPage() {
  const router = useRouter();
  const { t } = useTranslation('reflect');
  
  const PHASES: Array<{ id: 'START' | 'MID' | 'CLOSURE' | 'POST_CLOSURE'; label: string; desc: string }> = [
    { id: 'START', label: t('project.start'), desc: t('project.startDesc') },
    { id: 'MID', label: t('project.mid'), desc: t('project.midDesc') },
    { id: 'CLOSURE', label: t('project.closure'), desc: t('project.closureDesc') },
    { id: 'POST_CLOSURE', label: t('project.postClosure'), desc: t('project.postClosureDesc') },
  ];

  const FUNCTION_LABELS: Record<string, string> = {
    vision_setting: t('project.functionLabels.vision_setting'),
    facilitation: t('project.functionLabels.facilitation'),
    project_management: t('project.functionLabels.project_management'),
    writing: t('project.functionLabels.writing'),
    research: t('project.functionLabels.research'),
    coding: t('project.functionLabels.coding'),
    design: t('project.functionLabels.design'),
    fundraising: t('project.functionLabels.fundraising'),
    network_weaving: t('project.functionLabels.network_weaving'),
    strategic_thinking: t('project.functionLabels.strategic_thinking'),
    storytelling: t('project.functionLabels.storytelling'),
    coordination: t('project.functionLabels.coordination'),
    holding_space: t('project.functionLabels.holding_space'),
    data_analysis: t('project.functionLabels.data_analysis'),
    listening: t('project.functionLabels.listening'),
    teaching: t('project.functionLabels.teaching'),
  };
  
  const [step, setStep] = useState<'phase' | 'form'>('phase');
  const [phase, setPhase] = useState<'START' | 'MID' | 'CLOSURE' | 'POST_CLOSURE'>('START');
  const [projectName, setProjectName] = useState('');
  const [neededFunctions, setNeededFunctions] = useState<string[]>([]);
  const [presentFunctions, setPresentFunctions] = useState<string[]>([]);
  const [activeFunctions, setActiveFunctions] = useState<string[]>([]);
  const [absentFunctions, setAbsentFunctions] = useState<string[]>([]);
  const [whatItBecame, setWhatItBecame] = useState('');
  const [whatToCarry, setWhatToCarry] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!projectName.trim()) { setError(t('project.enterProjectName')); return; }
    setIsSubmitting(true); setError(null);
    try {
      const res = await saveProjectReflection({
        projectName,
        phase,
        neededFunctions,
        presentFunctions,
        activeFunctions,
        absentFunctions,
        whatItBecame: whatItBecame || undefined,
        whatToCarryForward: whatToCarry || undefined,
        privateNotes: privateNotes || undefined,
      });
      if (res.success) { router.push('/reflect'); }
      else { setError(res.error ?? t('errors.saveFailed')); }
    } finally { setIsSubmitting(false); }
  };

  if (step === 'phase') {
    return (
      <main className="max-w-xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/reflect" className="text-gray-400 hover:text-gray-600">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('project.title')}</h1>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('project.projectName')}</label>
          <Input value={projectName} onChange={(e) => setProjectName(e.target.value)}
            placeholder={t('project.projectNamePlaceholder')} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('project.whichPhase')}</label>
          <div className="grid grid-cols-2 gap-3">
            {PHASES.map(p => (
              <button key={p.id} type="button" onClick={() => setPhase(p.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${phase === p.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}>
                <div className="font-medium text-sm text-gray-900 dark:text-white">{p.label}</div>
                <div className="text-xs text-gray-400">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <Button onClick={() => { if (!projectName.trim()) { setError(t('project.enterProjectName')); return; } setError(null); setStep('form'); }}
          className="w-full">
          {t('project.next')} <ArrowRightIcon className="h-4 w-4 ml-2" />
        </Button>
        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
      </main>
    );
  }

  const phaseLabel = PHASES.find(p => p.id === phase)?.label ?? phase;

  return (
    <main className="max-w-xl mx-auto p-6 space-y-7">
      <div className="flex items-center gap-2">
        <button onClick={() => setStep('phase')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {projectName} — {phaseLabel}
        </h1>
      </div>

      {phase === 'START' && (
        <>
          <FunctionToggle selected={neededFunctions} onChange={setNeededFunctions}
            label={t('project.whatFunctionsNeeded')} t={t} />
          <FunctionToggle selected={presentFunctions} onChange={setPresentFunctions}
            label={t('project.whatPresentNow')} t={t} />
          {neededFunctions.length > 0 && presentFunctions.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs text-amber-700 dark:text-amber-300">
              🔍 {t('project.missingFunctions')} {neededFunctions.filter(f => !presentFunctions.includes(f)).map(f =>
                FUNCTION_LABELS[f] ?? f
              ).join(', ') || t('project.none')}
            </div>
          )}
        </>
      )}

      {phase === 'MID' && (
        <>
          <FunctionToggle selected={activeFunctions} onChange={setActiveFunctions}
            label={t('project.whichActiveNow')} t={t} />
          <FunctionToggle selected={absentFunctions} onChange={setAbsentFunctions}
            label={t('project.whichMissing')} t={t} />
        </>
      )}

      {phase === 'CLOSURE' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('project.whatItBecame')}
            </label>
            <textarea value={whatItBecame} onChange={(e) => setWhatItBecame(e.target.value)}
              className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              rows={3} placeholder={t('project.whatItBecamePlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('project.whatToCarry')}
            </label>
            <textarea value={whatToCarry} onChange={(e) => setWhatToCarry(e.target.value)}
              className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              rows={2} placeholder={t('project.whatToCarryPlaceholder')} />
          </div>
        </>
      )}

      {phase === 'POST_CLOSURE' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('project.lookingBack')}
            </label>
            <textarea value={whatItBecame} onChange={(e) => setWhatItBecame(e.target.value)}
              className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              rows={3} placeholder={t('project.lookingBackPlaceholder')} />
          </div>
        </>
      )}

      <div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <LockIcon className="h-3 w-3" /> {t('project.privateNotes')}
        </div>
        <textarea value={privateNotes} onChange={(e) => setPrivateNotes(e.target.value)}
          className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          rows={3} placeholder={t('project.privateNotesPlaceholder')} />
      </div>

      {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

      <Button onClick={handleSubmit} isLoading={isSubmitting} className="w-full">
        {t('project.save')}
      </Button>
    </main>
  );
}
