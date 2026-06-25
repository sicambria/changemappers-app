import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="text-6xl font-bold text-gray-200 dark:text-gray-700">404</div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Page not found
      </h1>
      <p className="max-w-md text-gray-500 dark:text-gray-400">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
      >
        Return to homepage
      </Link>
    </div>
  );
}
