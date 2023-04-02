import { axios } from '@/src/lifecycle/services';

export const fetchAvailableNames = () => axios.get('wordstats/names');
export const fetchPredictEnterWordstats = (date: string) => axios.get('predict/enter', { params: { date } });
export const fetchPredictLeaveWordstats = (keyword: string, date: string) =>
  axios.get('predict/leave', { params: { name: keyword, date } });
