import Link from 'next/link';

export type LegalTable = {
  headers: string[];
  rows: string[][];
};

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: LegalTable;
};

export type LegalDocumentContent = {
  title: string;
  effective: string;
  sections: LegalSection[];
  backHome: string;
};

export function LegalDocument({ content }: Readonly<{ content: LegalDocumentContent }>) {
  return (
    <div className="mx-auto max-w-4xl overflow-hidden px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">{content.title}</h1>
      <p className="text-gray-600 mb-8">{content.effective}</p>

      {content.sections.map((section) => (
        <section key={section.heading} className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">{section.heading}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="text-gray-600 leading-relaxed mt-4 first:mt-0">
              {paragraph}
            </p>
          ))}
          {section.bullets && (
            <ul className="list-disc ml-6 text-gray-600 space-y-2">
              {section.bullets.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
          {section.table && (
            <div className="mt-4 max-w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
              <table className="w-full table-fixed border-collapse text-left text-sm">
                <thead>
                  <tr>
                    {section.table.headers.map((header) => (
                      <th key={header} className="break-words border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.table.rows.map((row) => (
                    <tr key={row.join('|')}>
                      {row.map((cell) => (
                        <td key={cell} className="break-words border border-gray-200 px-3 py-2 text-sm text-gray-700">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}

      <div className="mt-12 pt-8 border-t border-gray-200">
        <Link href="/" className="text-emerald-600 hover:underline">
          {content.backHome}
        </Link>
      </div>
    </div>
  );
}
