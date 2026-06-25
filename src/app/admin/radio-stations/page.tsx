import { adminGetRadioStationsAction } from '@/app/actions/admin/radio-stations';
import { RadioStationsAdminClient } from './RadioStationsAdminClient';

export default async function RadioStationsAdminPage() {
  const result = await adminGetRadioStationsAction();
  const stations = result.success && result.data ? result.data : [];

  return <RadioStationsAdminClient initialStations={stations} />;
}
