'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ActionRequirements } from '@/components/ui/ActionRequirements';
import { DATE_PRESETS, getDatesInRange, formatDateForInput } from './schedulingPoll.config';
import type { TimeSlot } from './schedulingPoll.config';

interface BatchDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (slots: TimeSlot[]) => void;
}

interface BatchDateInputsProps {
  batchStartDate: string;
  batchEndDate: string;
  batchFullDay: boolean;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onFullDayChange: (value: boolean) => void;
}

function BatchDateInputs({
  batchStartDate,
  batchEndDate,
  batchFullDay,
  onStartDateChange,
  onEndDateChange,
  onFullDayChange,
}: Readonly<BatchDateInputsProps>) {
  const { t } = useTranslation('scheduling');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('create.batchModal.startDate', { defaultValue: 'Start Date' })}
        </label>
        <div className="flex gap-2 mb-2">
          {DATE_PRESETS.slice(0, 3).map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onStartDateChange(formatDateForInput(preset.days))}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-emerald-100 rounded transition"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={batchStartDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('create.batchModal.endDate', { defaultValue: 'End Date' })}
        </label>
        <div className="flex gap-2 mb-2">
          {DATE_PRESETS.slice(3).map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onEndDateChange(formatDateForInput(preset.days))}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-emerald-100 rounded transition"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={batchEndDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={batchFullDay}
          onChange={(e) => onFullDayChange(e.target.checked)}
          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        <span className="text-sm text-gray-700">{t('create.fullDay')}</span>
      </label>
    </div>
  );
}

export function BatchDateModal({ isOpen, onClose, onApply }: Readonly<BatchDateModalProps>) {
  const { t } = useTranslation('scheduling');

  const [batchStartDate, setBatchStartDate] = useState(formatDateForInput(0));
  const [batchEndDate, setBatchEndDate] = useState(formatDateForInput(7));
  const [batchFullDay, setBatchFullDay] = useState(true);

  const batchDateRequirementsId = 'scheduling-batch-date-requirements';
  const batchDateRequirements = [
    !batchStartDate ? t('common:actionRequirements.chooseBatchStartDate') : null,
    !batchEndDate ? t('common:actionRequirements.chooseBatchEndDate') : null,
  ];

  const handleApply = () => {
    if (!batchStartDate || !batchEndDate) return;

    const dates = getDatesInRange(batchStartDate, batchEndDate);
    const newSlots: TimeSlot[] = dates.map((date) => ({
      id: crypto.randomUUID(),
      date,
      mode: 'single',
      times: batchFullDay ? [] : [{ id: crypto.randomUUID(), start: '09:00', end: '18:00' }],
      isFullDay: batchFullDay,
    }));

    onApply(newSlots);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy="batch-date-modal-title"
      className="max-w-md"
      closeOnBackdropClick={false}
    >
      <div className="bg-white rounded-xl shadow-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 id="batch-date-modal-title" className="text-lg font-bold text-gray-900">{t('create.batchModal.title', { defaultValue: 'Add Date Range' })}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('a11y.close', { defaultValue: 'Close' })}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          {t('create.batchModal.description', { defaultValue: 'Create slots for all dates between start and end dates.' })}
        </p>

        <BatchDateInputs
          batchStartDate={batchStartDate}
          batchEndDate={batchEndDate}
          batchFullDay={batchFullDay}
          onStartDateChange={setBatchStartDate}
          onEndDateChange={setBatchEndDate}
          onFullDayChange={setBatchFullDay}
        />

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            {t('organizer.cancelButton')}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleApply}
            disabled={!batchStartDate || !batchEndDate}
            disabledReasonId={batchDateRequirementsId}
          >
            {t('create.batchModal.addButton', { defaultValue: 'Add Slots' })}
          </Button>
        </div>
        <ActionRequirements id={batchDateRequirementsId} requirements={batchDateRequirements} />
      </div>
    </Modal>
  );
}
