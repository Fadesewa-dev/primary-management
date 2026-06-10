import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface AcademicYear {
  id: string;
  year_name: string;
  is_current: boolean;
}

export function useAcademicYear() {
  const [currentYear, setCurrentYear] = useState('');
  const [allYears, setAllYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('academic_years')
      .select('id, year_name, is_current')
      .order('year_name', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setAllYears(data);
          const current = data.find((y) => y.is_current) ?? data[0];
          setCurrentYear(current.year_name);
        }
        setLoading(false);
      });
  }, []);

  return { currentYear, allYears, loading };
}
