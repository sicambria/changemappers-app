interface PeerSupportOfferCardProps {
  offer: {
    id: string;
    format: string;
    boundaryStatement: string;
    situationsNavigated: string[];
    offerer: {
      name: string;
      displayName?: string | null;
      profilePhoto?: string | null;
    };
  };
}

const FORMAT_LABELS: Record<string, string> = {
  ONE_ON_ONE: '1-on-1',
  GROUP: 'Group',
  ASYNC: 'Async',
  STRUCTURED: 'Structured',
};

export default function PeerSupportOfferCard({ offer }: Readonly<PeerSupportOfferCardProps>) {
  const displayName = offer.offerer.displayName ?? offer.offerer.name;
  const boundaryPreview =
    offer.boundaryStatement.length > 120
      ? offer.boundaryStatement.slice(0, 120) + '…'
      : offer.boundaryStatement;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {offer.offerer.profilePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={offer.offerer.profilePhoto}
              alt={displayName}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-medium text-gray-900 dark:text-gray-100">{displayName}</span>
        </div>

        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          {FORMAT_LABELS[offer.format] ?? offer.format}
        </span>
      </div>

      {offer.situationsNavigated.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {offer.situationsNavigated.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
          {offer.situationsNavigated.length > 5 && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              +{offer.situationsNavigated.length - 5} more
            </span>
          )}
        </div>
      )}

      <p className="text-sm italic text-gray-500 dark:text-gray-400">&ldquo;{boundaryPreview}&rdquo;</p>
    </div>
  );
}
