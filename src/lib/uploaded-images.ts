import sharp from 'sharp';

const DATA_URL_PATTERN = /^data:image\/(jpeg|jpg|png|gif|webp);base64,([a-zA-Z0-9+/=\s]+)$/;
const MAX_OUTPUT_BYTES = 500 * 1024;

export type UploadedImageKind = 'avatar' | 'cover';

const TARGETS: Record<UploadedImageKind, { maxWidth: number; maxHeight: number }> = {
  avatar: { maxWidth: 512, maxHeight: 512 },
  cover: { maxWidth: 1600, maxHeight: 900 },
};

export class UploadedImageNormalizationError extends Error {
  constructor(message = 'Invalid image upload') {
    super(message);
    this.name = 'UploadedImageNormalizationError';
  }
}

export function isUploadedImageDataUrl(value: string): boolean {
  return DATA_URL_PATTERN.test(value);
}

export async function normalizeUploadedImageDataUrl(
  value: string | undefined,
  kind: UploadedImageKind,
): Promise<string | undefined> {
  if (value === undefined || value === '') return value;
  if (/^https?:\/\//i.test(value)) {
    throw new UploadedImageNormalizationError('Remote image URLs are not supported');
  }

  const match = DATA_URL_PATTERN.exec(value);
  if (!match) {
    throw new UploadedImageNormalizationError('Unsupported image format');
  }

  const input = Buffer.from(match[2].replaceAll(/\s/g, ''), 'base64');
  const target = TARGETS[kind];
  const image = sharp(input, { animated: false, limitInputPixels: 25_000_000 }).rotate().resize({
    width: target.maxWidth,
    height: target.maxHeight,
    fit: 'inside',
    withoutEnlargement: true,
  });

  for (const quality of [82, 72, 62, 52]) {
    const output = await image.clone().webp({ quality, effort: 4 }).toBuffer();
    if (output.byteLength <= MAX_OUTPUT_BYTES) {
      return `data:image/webp;base64,${output.toString('base64')}`;
    }
  }

  throw new UploadedImageNormalizationError('Image remains too large after optimization');
}
