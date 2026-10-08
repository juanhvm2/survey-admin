import { useEffect, useState } from 'react';
import { surveysService } from '@/services/surveysService';

export function useSurveys() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const data = await surveysService.list();
    setSurveys(data);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  return { surveys, loading, refresh };
}