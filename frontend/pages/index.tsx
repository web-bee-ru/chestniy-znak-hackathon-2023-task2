import {Autocomplete, Box, Button, styled, TextField, Typography} from '@mui/material';
import {useEffect, useMemo, useState} from 'react';
import {isAxiosError} from '@/src/lifecycle/services';

import {Chart as ChartJS, ChartData, ChartOptions, registerables} from 'chart.js';
import {Line} from 'react-chartjs-2';
import {AxiosError} from 'axios';
import {
  fetchAvailableNames,
  fetchPredictEnterWordstats,
  fetchPredictLeaveWordstats,
} from '@/src/services/fetchers/wordstats';

ChartJS.register(...registerables);

const BoxWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const StyledButton = styled(Button)`
  flex-grow: 1;
  border-radius: 12px;
  background: ${({ theme }) => theme.palette.primary.dark};
  color: ${({ theme }) => theme.palette.primary.contrastText};

  &:disabled {
    background: ${({ theme }) => theme.palette.info.dark};
    color: ${({ theme }) => theme.palette.primary.contrastText};
  }

  &:hover {
    background: ${({ theme }) => theme.palette.primary.main};
  }
`;

interface Stats {
  date: string;
  value: number | string;
}

interface DefaultStats {
  before: Stats[];
  after: Stats[];
  predict: Stats[];
}

const enterOptions: ChartOptions<any> = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
  datasets: {
    line: {
      pointStyle: false,
    },
  },
};

const leaveOptions: ChartOptions<any> = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
  datasets: {
    line: {
      pointStyle: false,
    },
  },
  scales: {
    y: {
      type: 'linear',
      display: true,
      position: 'left',
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
    },
  },
};

const distinctConcatObjectArray = (arr1: any[], arr2: any[], key: string) => {
  const concatArray = [];
  const dict = new Set();

  for (const element of arr1) {
    concatArray.push(element);
    dict.add(element[key]);
  }

  for (const element of arr2) {
    if (!dict.has(element[key])) {
      concatArray.push(element);
    }
  }

  return concatArray;
};

const Index = () => {
  const [enterStats, setEnterStats] = useState<{ enter: DefaultStats }>();
  const [leaveStats, setLeaveStats] = useState<{ leave: DefaultStats; stats: { yandex: Stats[]; google: Stats[] } }>();
  const [wordstatsVariations, setWordstatsVariations] = useState<{ value: string; title: string }[]>([]);
  const [keyword, setKeyword] = useState('');
  const [date, setDate] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AxiosError>();
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const availableNamesRes = await fetchAvailableNames();
        const enterRes = await fetchPredictEnterWordstats('2022-11-17');
        const leaveRes = await fetchPredictLeaveWordstats('парфюм', '2022-11-17');

        setEnterStats(enterRes.data);
        setLeaveStats(leaveRes.data);
        setWordstatsVariations(availableNamesRes.data);
        setIsLoading(false);
      } catch (e) {
        if (isAxiosError(e)) setError(e);
      }
    })();
  }, []);

  const enterData = useMemo<ChartData<any, any, any>>(() => {
    const beforeStats = enterStats?.enter.before ?? [];
    const afterStats = enterStats?.enter.after ?? [];
    const predictStats = enterStats?.enter.predict ?? [];

    const labels = distinctConcatObjectArray(
      distinctConcatObjectArray(beforeStats, afterStats, 'date'),
      predictStats,
      'date',
    ).map(({ date }) => date);

    return {
      labels,
      datasets: [
        {
          label: 'beforeStats',
          data: beforeStats,
          fill: 'smooth',
          cubicInterpolationMode: 'monotone',
          borderColor: 'rgba(88,80,239,0.89)',
          tension: 0.1,
          yAxisID: 'y',
          order: 1,
          parsing: {
            xAxisKey: 'date',
            yAxisKey: 'value',
          },
        },
        {
          label: 'afterStats',
          data: afterStats,
          fill: 'smooth',
          cubicInterpolationMode: 'monotone',
          borderColor: 'rgba(161,91,231,0.81)',
          tension: 0.1,
          yAxisID: 'y',
          order: 1,
          parsing: {
            xAxisKey: 'date',
            yAxisKey: 'value',
          },
        },
        {
          label: 'predictStats',
          data: predictStats,
          fill: 'smooth',
          cubicInterpolationMode: 'monotone',
          borderColor: 'rgba(80,239,144,0.89)',
          tension: 0.1,
          yAxisID: 'y',
          order: 0,
          parsing: {
            xAxisKey: 'date',
            yAxisKey: 'value',
          },
        },
      ],
    };
  }, [enterStats]);

  const leaveData = useMemo<ChartData<any, any, any>>(() => {
    const beforeStats = leaveStats?.leave.before ?? [];
    const afterStats = leaveStats?.leave.after ?? [];
    const predictStats = leaveStats?.leave.predict ?? [];
    const googleHIstory = leaveStats?.stats.google ?? [];

    const labels = distinctConcatObjectArray(
      distinctConcatObjectArray(distinctConcatObjectArray(beforeStats, afterStats, 'date'), predictStats, 'date'),
      googleHIstory,
      'date',
    )
      .map(({ date }) => date)
      .sort((a, b) => +new Date(a) - +new Date(b));

    return {
      labels,
      datasets: [
        {
          label: 'beforeStats',
          data: beforeStats,
          fill: 'smooth',
          cubicInterpolationMode: 'monotone',
          borderColor: 'rgba(88,80,239,0.89)',
          tension: 0.1,
          yAxisID: 'y',
          order: 1,
          parsing: {
            xAxisKey: 'date',
            yAxisKey: 'value',
          },
        },
        {
          label: 'afterStats',
          data: afterStats,
          fill: 'smooth',
          cubicInterpolationMode: 'monotone',
          borderColor: 'rgba(161,91,231,0.81)',
          tension: 0.1,
          yAxisID: 'y',
          order: 1,
          parsing: {
            xAxisKey: 'date',
            yAxisKey: 'value',
          },
        },
        {
          label: 'predictStats',
          data: predictStats,
          fill: 'smooth',
          cubicInterpolationMode: 'monotone',
          borderColor: 'rgba(80,239,144,0.89)',
          tension: 0.1,
          yAxisID: 'y',
          order: 0,
          parsing: {
            xAxisKey: 'date',
            yAxisKey: 'value',
          },
        },
        {
          label: 'googleHIstory',
          data: googleHIstory,
          fill: 'smooth',
          cubicInterpolationMode: 'monotone',
          borderColor: 'rgba(238,25,25,0.81)',
          tension: 0.1,
          yAxisID: 'y1',
          parsing: {
            xAxisKey: 'date',
            yAxisKey: 'value',
          },
        },
      ],
    };
  }, [leaveStats]);

  if (error) {
    return <Box>{error.message}</Box>;
  }

  return !isLoading ? (
    <Box display="flex" flexDirection="column" gap={2} style={{ overflow: 'scroll' }}>
      <Box display="flex" gap={5} justifyContent={'space-between'}>
        <BoxWrapper flexGrow={2}>
          <Typography variant="subtitle2" fontSize={20}>
            Дата начала прогноза
          </Typography>
          {/*<DatePicker value={date} onChange={(value) => setDate(value)} />*/}
        </BoxWrapper>
        <BoxWrapper flexGrow={2}>
          <Typography variant="subtitle2" fontSize={20}>
            Поисковой запрос
          </Typography>
          <Autocomplete
            onChange={(_event, value) => {
              setKeyword(value?.value ?? '');
              return value;
            }}
            getOptionLabel={(option) => option.title}
            renderInput={(params) => <TextField {...params} />}
            options={wordstatsVariations}
          />
        </BoxWrapper>
        <StyledButton disabled={!keyword}>Запустить</StyledButton>
      </Box>
      <BoxWrapper>
        <Typography variant="subtitle2">Гипотеза #1. Прогнозирование объёмов ввода товаров в оборот</Typography>
        <Line height={500} width={1800} data={enterData} options={enterOptions} />
      </BoxWrapper>
      <BoxWrapper>
        <Typography variant="subtitle2">Гипотеза #2. Прогнозирование спроса на товары</Typography>
        <Line height={500} width={1800} data={leaveData} options={leaveOptions} />
      </BoxWrapper>
    </Box>
  ) : (
    <Box>Loading ...</Box>
  );
};

export default Index;
