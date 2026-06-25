import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

const MTA_STS_POLICY = [
  'version: STSv1',
  'mode: enforce',
  'mx: mail.changemappers.org',
  'max_age: 604800',
].join('\n') + '\n';

function policyResponse() {
  return new NextResponse(MTA_STS_POLICY, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

export function GET() {
  return policyResponse();
}
export function HEAD() {
  return policyResponse();
}
