'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Plus, X, Copy, Sparkles, ChevronDown, CalendarRange, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createSchedulingPollAction } from '@/app/actions/scheduling';
import type { CreateSchedulingPollInput } from '@/lib/validations/scheduling';
import { ActionRequirements } from '@/components/ui/ActionRequirements';
import {
  TIME_PRESETS,
  INITIAL_SLOTS,
  getDatesInRange,
} from './schedulingPoll.config';
import type { TimeSlot, SlotMode } from './schedulingPoll.config';
import { BatchDateModal } from './BatchDateModal';
import { PollCreatedSuccess } from './PollCreatedSuccess';

interface SchedulingPollFormClientProps {
  prefillName: string | null;
}

function appendDateTimeOptions(
  slot: TimeSlot,
  date: string,
  timeOptions: Array<{ startTime: Date; endTime: Date | undefined }>,
): void {
  if (slot.isFullDay || slot.times.length === 0) {
    timeOptions.push({ startTime: new Date(`${date}T00:00:00`), endTime: undefined });
    return;
  }
  for (const time of slot.times) {
    if (!time.start) continue;
    timeOptions.push({
      startTime: new Date(`${date}T${time.start}:00`),
      endTime: time.end ? new Date(`${date}T${time.end}:00`) : undefined,
    });
  }
}

export default function SchedulingPollFormClient({ prefillName }: Readonly<SchedulingPollFormClientProps>) {
  const { t } = useTranslation('scheduling');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [organizerName, setOrganizerName] = useState(prefillName ?? '');
  const [location, setLocation] = useState('');
  const [timezone, setTimezone] = useState('');

  const [slots, setSlots] = useState<TimeSlot[]>(INITIAL_SLOTS);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrepopulate, setShowPrepopulate] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);

  const [createdPoll, setCreatedPoll] = useState<{
    id: string;
    participantToken: string;
    organizerToken: string;
  } | null>(null);

  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(detected);
    } catch {
      setTimezone('UTC');
    }
  }, []);

  const addSlot = () => {
    setSlots([
      ...slots,
      { id: crypto.randomUUID(), date: '', mode: 'single', times: [], isFullDay: true },
    ]);
  };

  const removeSlot = (id: string) => {
    if (slots.length <= 2) return;
    setSlots(slots.filter((slot) => slot.id !== id));
  };

  const clearAllSlots = () => {
    setSlots([
      { id: crypto.randomUUID(), date: '', mode: 'single', times: [], isFullDay: true },
      { id: crypto.randomUUID(), date: '', mode: 'single', times: [], isFullDay: true },
    ]);
  };

  const updateSlotField = (slotId: string, field: keyof TimeSlot, value: string | boolean) => {
    setSlots(
      slots.map((slot) => {
        if (slot.id !== slotId) return slot;

        if (field === 'mode') {
          const newMode = value as SlotMode;
          return {
            ...slot,
            mode: newMode,
            endDate: newMode === 'range' ? '' : undefined,
          };
        }

        if (field === 'isFullDay') {
          const isFullDay = value as boolean;
          return {
            ...slot,
            isFullDay,
            times: isFullDay ? [] : [{ id: crypto.randomUUID(), start: '', end: '' }],
          };
        }

        return { ...slot, [field]: value };
      }),
    );
  };

  const addTimeToSlot = (slotId: string) => {
    setSlots(
      slots.map((slot) => {
        if (slot.id !== slotId) return slot;
        return {
          ...slot,
          times: [...slot.times, { id: crypto.randomUUID(), start: '', end: '' }],
        };
      }),
    );
  };

  const removeTimeFromSlot = (slotId: string, timeId: string) => {
    setSlots(
      slots.map((slot) => {
        if (slot.id !== slotId) return slot;
        if (slot.times.length <= 1) return slot;
        return {
          ...slot,
          times: slot.times.filter((t) => t.id !== timeId),
        };
      }),
    );
  };

  const updateTimeInSlot = (slotId: string, timeId: string, field: 'start' | 'end', value: string) => {
    setSlots(
      slots.map((slot) => {
        if (slot.id !== slotId) return slot;
        return {
          ...slot,
          times: slot.times.map((t) => (t.id === timeId ? { ...t, [field]: value } : t)),
        };
      }),
    );
  };

  const copyFirstTimeToAll = (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot || slot.times.length === 0) return;

    const firstTime = slot.times[0];
    setSlots(
      slots.map((s) => ({
        ...s,
        times: s.times.map((t) => ({
          ...t,
          start: firstTime.start,
          end: firstTime.end,
        })),
      })),
    );
  };

  const prepopulateNextDays = (days: number, timePreset: keyof typeof TIME_PRESETS) => {
    const today = new Date();
    const newSlots: TimeSlot[] = [];

    for (let i = 1; i <= days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      newSlots.push({
        id: crypto.randomUUID(),
        date: dateStr,
        mode: 'single',
        times: [{ id: crypto.randomUUID(), ...TIME_PRESETS[timePreset] }],
        isFullDay: false,
      });
    }

    setSlots(newSlots);
    setShowPrepopulate(false);
  };

  const expandSlotsToTimeOptions = (): Array<{ startTime: Date; endTime: Date | undefined }> => {
    const timeOptions: Array<{ startTime: Date; endTime: Date | undefined }> = [];
    for (const slot of slots) {
      const dates = slot.mode === 'range' && slot.endDate
        ? getDatesInRange(slot.date, slot.endDate)
        : [slot.date];
      for (const date of dates) {
        if (!date) continue;
        appendDateTimeOptions(slot, date, timeOptions);
      }
    }
    return timeOptions;
  };

  const expandedSlotCount = expandSlotsToTimeOptions().length;
  const slotLimitRequirementsId = 'scheduling-slot-limit-requirements';
  const slotLimitRequirements = [
    expandedSlotCount >= 50 ? t('common:actionRequirements.slotLimitReached') : null,
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const timeOptions = expandSlotsToTimeOptions();

    if (timeOptions.length < 2) {
      setError(t('create.minTimeSlotsError'));
      setIsSubmitting(false);
      return;
    }

    if (timeOptions.length > 50) {
      setError(t('create.maxTimeSlotsError'));
      setIsSubmitting(false);
      return;
    }

    const input: CreateSchedulingPollInput = {
      title,
      description: description || undefined,
      organizerName,
      location: location || undefined,
      timezone,
      timeOptions,
    };

    const result = await createSchedulingPollAction(input);

    if (result.success && result.data) {
      setCreatedPoll(result.data);
    } else if (!result.success) {
      const apiResult = result as { success: false; error?: string; errors?: Record<string, string[]> };
      setError(
        apiResult.errors?.title?.[0] ||
        apiResult.error ||
        t('errors.generic'),
      );
    }

    setIsSubmitting(false);
  };

  if (createdPoll) {
    return <PollCreatedSuccess createdPoll={createdPoll} />;
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('create.meetingTitle')}
          </label>
          <input
            type="text"
            placeholder={t('create.meetingTitlePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('create.description')}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('create.descriptionPlaceholder')}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('create.organizerName')}
          </label>
          <input
            type="text"
            placeholder={t('create.organizerNamePlaceholder')}
            value={organizerName}
            onChange={(e) => setOrganizerName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('create.location')}
          </label>
          <input
            type="text"
            placeholder={t('create.locationPlaceholder')}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900">{t('create.timeOptions')}</h3>
              <p className="text-xs text-gray-500">{t('create.detectedTimezone', { timezone })}</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowBatchModal(true)}
              >
                <CalendarRange className="h-4 w-4 mr-1" />
                {t('create.addDateRange', { defaultValue: 'Date range' })}
              </Button>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPrepopulate(!showPrepopulate)}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  {t('create.prepopulate')}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
                {showPrepopulate && (
                  <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px]">
                    <p className="text-xs text-gray-500 mb-2 px-2">{t('create.prepopulateHint')}</p>
                    <div className="space-y-1">
                      {[3, 5, 7].map((days) => (
                        <div key={days} className="space-y-1">
                          {['morning', 'afternoon', 'evening'].map((preset) => (
                            <button
                              key={`${days}-${preset}`}
                              type="button"
                              onClick={() => prepopulateNextDays(days, preset as keyof typeof TIME_PRESETS)}
                              className="w-full text-left px-2 py-1.5 text-xs hover:bg-emerald-50 rounded transition"
                            >
                              {t(`create.next${days}Days`)} - {t(`create.${preset}`)}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSlot}
                disabled={expandedSlotCount >= 50}
                disabledReasonId={slotLimitRequirementsId}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('create.addTimeSlot')}
              </Button>
              {slots.length > 2 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearAllSlots}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <ActionRequirements id={slotLimitRequirementsId} requirements={slotLimitRequirements} />

          <div className="space-y-4">
            {slots.map((slot, index) => (
              <div
                key={slot.id}
                className="p-3 bg-white rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-gray-500">{t('create.timeSlotLabel', { number: index + 1 })}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => updateSlotField(slot.id, 'mode', 'single')}
                      className={`px-2 py-0.5 text-xs rounded transition ${
                        slot.mode === 'single'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t('create.singleDay')}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSlotField(slot.id, 'mode', 'range')}
                      className={`px-2 py-0.5 text-xs rounded transition ${
                        slot.mode === 'range'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t('create.dateRange')}
                    </button>
                  </div>
                  {slots.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(slot.id)}
                      aria-label={t('a11y.removeSlot', { defaultValue: 'Remove date' })}
                      className="ml-auto p-1 text-gray-400 hover:text-red-500 transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <div className="flex-1 min-w-[140px]">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="date"
                        value={slot.mode === 'range' ? '' : slot.date}
                        onChange={(e) => updateSlotField(slot.id, 'date', e.target.value)}
                        placeholder={slot.mode === 'range' ? t('create.batchModal.startDate') : t('create.singleDay')}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required={slot.mode === 'single'}
                      />
                    </div>
                  </div>
                  {slot.mode === 'range' && (
                    <div className="flex-1 min-w-[140px]">
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="date"
                          value={slot.endDate || ''}
                          onChange={(e) => updateSlotField(slot.id, 'endDate', e.target.value)}
                          placeholder={t('create.batchModal.endDate')}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          required={slot.mode === 'range'}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={slot.isFullDay}
                      onChange={(e) => updateSlotField(slot.id, 'isFullDay', e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    {t('create.fullDay', { defaultValue: 'Full day (no specific time)' })}
                  </label>
                </div>

                {!slot.isFullDay && (
                  <div className="space-y-2">
                    {slot.times.map((time, timeIndex) => (
                      <div key={time.id} className="flex items-center gap-2">
                        <div className="flex-1 flex gap-2">
                          <div className="flex-1 max-w-[120px]">
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                type="time"
                                value={time.start}
                                onChange={(e) => updateTimeInSlot(slot.id, time.id, 'start', e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                required={timeIndex === 0}
                              />
                            </div>
                          </div>
                          <div className="flex-1 max-w-[120px]">
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                type="time"
                                value={time.end}
                                onChange={(e) => updateTimeInSlot(slot.id, time.id, 'end', e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>
                          </div>
                        </div>
                        {slot.times.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTimeFromSlot(slot.id, time.id)}
                            aria-label={t('a11y.removeTime', { defaultValue: 'Remove time' })}
                            className="p-1 text-gray-400 hover:text-red-500 transition"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => addTimeToSlot(slot.id)}
                        className="text-xs text-emerald-600 hover:text-emerald-700"
                      >
                        + {t('create.addTime')}
                      </button>
                      {slot.times.length > 0 && slot.times[0].start && (
                        <button
                          type="button"
                          onClick={() => copyFirstTimeToAll(slot.id)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          <Copy className="h-3 w-3 inline mr-1" />
                          {t('create.copyToAll')}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isSubmitting}
        >
          {isSubmitting ? t('create.creating') : t('create.createButton')}
        </Button>
      </form>

      {/* Batch Date Range Modal */}
      <BatchDateModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onApply={(newSlots) => {
          setSlots(newSlots);
          setShowBatchModal(false);
        }}
      />
    </>
  );
}
