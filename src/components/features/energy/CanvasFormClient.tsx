'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { createEnergyCanvasAction } from '@/app/actions/energy/canvas';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export function CanvasFormClient() {
  const router = useRouter();
  const { t } = useTranslation('energy');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [privacy, setPrivacy] = useState('ONLY_ME');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const result = await createEnergyCanvasAction({
      title: formData.get('title') as string,
      description: formData.get('description') as string || undefined,
      privacy: privacy as 'ONLY_ME' | 'MY_COMMUNITY' | 'PUBLIC',
    });

    if (result.success && result.data) {
      router.push(`/energy/${result.data.id}`);
    } else {
      setIsSubmitting(false);
      toast.error('error' in result ? result.error : t('canvasForm.createFailed'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('canvasForm.createTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">{t('canvasForm.titleLabel')}</Label>
          <Input
            id="title"
            name="title"
            placeholder={t('canvasForm.titlePlaceholder')}
              required
              minLength={2}
              maxLength={200}
            />
          </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t('canvasForm.descriptionOptional')}</Label>
          <Textarea
            id="description"
            name="description"
            placeholder={t('canvasForm.descriptionPlaceholder')}
              maxLength={2000}
              rows={3}
            />
          </div>

        <div className="space-y-2">
          <Label htmlFor="privacy">{t('canvasForm.privacyLabel')}</Label>
          <Select onValueChange={setPrivacy} defaultValue={privacy}>
            <SelectTrigger>
              <SelectValue placeholder={t('canvasForm.privacyPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ONLY_ME">{t('privacy.onlyMe')}</SelectItem>
              <SelectItem value="MY_COMMUNITY">{t('privacy.myCommunity')}</SelectItem>
              <SelectItem value="PUBLIC">{t('privacy.public')}</SelectItem>
              </SelectContent>
            </Select>
          <p className="text-xs text-muted-foreground">
            {t('canvasForm.privacyNote')}
          </p>
          </div>

          <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('canvasForm.creating') : t('canvasForm.createCanvas')}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/energy')}>
          {t('canvasForm.cancel')}
        </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
