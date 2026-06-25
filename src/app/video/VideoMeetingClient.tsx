'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { Loader2, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ActionRequirements } from '@/components/ui/ActionRequirements';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@/components/ui';
import { isValidVideoRoomName, normalizeVideoRoomInput } from './videoRoom';

interface VideoMeetingClientProps {
  initialRoomName?: string;
  initialError?: string;
  currentUser?: {
    name?: string;
    displayName?: string;
    email?: string;
  };
  basePath?: string;
}

function getJitsiDomain(): string {
  return (process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si').replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80" data-testid="jitsi-loading">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function VideoMeetingClient({
  initialRoomName,
  initialError,
  currentUser,
  basePath = '/video',
}: Readonly<VideoMeetingClientProps>) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [roomInput, setRoomInput] = useState(initialRoomName ?? '');
  const normalizedRoomInput = normalizeVideoRoomInput(roomInput);
  const roomRequirementsId = 'video-room-requirements';
  const roomRequirements = [
    !isValidVideoRoomName(normalizedRoomInput) ? t('actionRequirements.enterRoomName') : null,
  ];

  const roomName = initialRoomName && isValidVideoRoomName(initialRoomName) ? initialRoomName : undefined;
  const appName = process.env.NEXT_PUBLIC_JITSI_APP_NAME || 'Changemappers';
  const domain = getJitsiDomain();

  const userInfo = useMemo(() => {
    const displayName = currentUser?.displayName || currentUser?.name || appName;
    const email = currentUser?.email || '';
    return { displayName, email };
  }, [appName, currentUser?.displayName, currentUser?.email, currentUser?.name]);

  const configOverwrite = useMemo(() => ({
    prejoinPageEnabled: true,
    startWithAudioMuted: true,
    startWithVideoMuted: true,
    disableDeepLinking: true,
  }), []);

  const interfaceConfigOverwrite = useMemo(() => ({
    APP_NAME: appName,
    SHOW_JITSI_WATERMARK: false,
  }), [appName]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedRoomName = normalizeVideoRoomInput(roomInput);
    if (!isValidVideoRoomName(normalizedRoomName)) {
      setRoomInput(normalizedRoomName);
      return;
    }
    router.push(`${basePath}?room=${encodeURIComponent(normalizedRoomName)}`);
  };

  if (!roomName) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-3xl items-center px-4 py-8">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Video className="h-5 w-5" />
              </span>
              <div>
                <CardTitle>{t('video.title')}</CardTitle>
                <CardDescription>{t('video.subtitle')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {initialError ? (
              <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {initialError}
              </p>
            ) : null}
            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="video-room-name">{t('video.roomLabel')}</Label>
                <Input
                  id="video-room-name"
                  value={roomInput}
                  onChange={(event) => setRoomInput(event.target.value)}
                  placeholder={t('video.roomPlaceholder')}
                  aria-describedby="video-room-help"
                />
                <p id="video-room-help" className="text-xs text-muted-foreground">
                  {t('video.roomHelp')}
                </p>
              </div>
              <div className="space-y-2 sm:mt-8">
                <ActionRequirements id={roomRequirementsId} requirements={roomRequirements} />
              <Button type="submit" disabled={!isValidVideoRoomName(normalizeVideoRoomInput(roomInput))} disabledReasonId={roomRequirements.some(Boolean) ? roomRequirementsId : undefined}>
                <Video className="mr-2 h-4 w-4" />
                {t('video.join')}
              </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-7xl flex-col px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">{t('video.meetingTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('video.roomName', { roomName })}</p>
        </div>
        <Button variant="outline" onClick={() => router.push(basePath)}>
          {t('video.changeRoom')}
        </Button>
      </div>
      <div className="relative min-h-[520px] flex-1 overflow-hidden rounded-md border bg-background md:min-h-[640px] [&_iframe]:h-full [&_iframe]:min-h-[520px] [&_iframe]:w-full md:[&_iframe]:min-h-[640px]">
        <JitsiMeeting
          domain={domain}
          roomName={roomName}
          configOverwrite={configOverwrite}
          interfaceConfigOverwrite={interfaceConfigOverwrite}
          userInfo={userInfo}
          spinner={LoadingSpinner}
          getIFrameRef={(parentNode) => {
            const iframe = parentNode.querySelector('iframe');
            iframe?.setAttribute('allow', 'camera; microphone; fullscreen; display-capture; autoplay');
            iframe?.setAttribute('title', t('video.iframeTitle'));
          }}
        />
      </div>
    </main>
  );
}
