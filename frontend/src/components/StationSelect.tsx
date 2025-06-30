import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { stationService } from '../services/api';
import type { Station } from '../services/api';

interface StationSelectProps {
  value: number | null;
  onChange: (stationId: number | null) => void;
}

const StationSelect: React.FC<StationSelectProps> = ({ value, onChange }) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    stationService.getStations()
      .then(setStations)
      .finally(() => setLoading(false));
  }, []);

  const options = stations.map(station => ({
    value: station.id,
    label: station.name
  }));

  return (
    <Select
      isClearable
      isLoading={loading}
      options={options}
      value={options.find(opt => opt.value === value) || null}
      onChange={opt => onChange(opt ? opt.value : null)}
      placeholder="Selecciona una estación..."
      classNamePrefix="react-select"
    />
  );
};

export default StationSelect;
