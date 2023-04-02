import {Autocomplete, Box, Button, styled, TextField, Typography} from '@mui/material';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {isAxiosError} from '@/src/lifecycle/services';
import {DatePicker} from '@mui/x-date-pickers';
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

const StyledTypography = styled(Typography)`
  font-size: 32px;
  font-weight: 400;
  line-height: 44px;
  letter-spacing: 0em;
  text-align: center;
`;

const InnerBlock = styled(Box)`
  background-color: #49454f;
`;

const GraphWrap = styled(Box)`
  padding: 30px 30px;
  color: white;
  background-color: black;
`;

const InputBoxWrapper = styled(Box)`
  background: #fef7ff;
  position: relative;
  padding: 16px;
  border: 1px solid #cac4d0;
  border-radius: 16px;
`;
const StyledButton = styled(Button)`
  flex-grow: 1;
  height: 56px;
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

const DISPLAY_DATE_FORMAT = 'dd.MM.yyyy';
const SERVER_DATE_FORMAT = 'yyyy-MM-dd';
const Index = () => {
  const [enterStats, setEnterStats] = useState<{ enter: DefaultStats }>();
  const [leaveStats, setLeaveStats] = useState<{ leave: DefaultStats; stats: { yandex: Stats[]; google: Stats[] } }>();
  const [wordstatsVariations, setWordstatsVariations] = useState<{ value: string; title: string }[]>([]);
  const [keyword, setKeyword] = useState('парфюм');

  const [date, setDate] = useState<Date>(new Date('2022-12-22'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AxiosError>();
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const availableNamesRes = await fetchAvailableNames();
        const enterRes = await fetchPredictEnterWordstats(date.toISOString());
        const leaveRes = await fetchPredictLeaveWordstats(keyword || 'парфюм', date.toISOString());

        setEnterStats(enterRes.data);
        setLeaveStats(leaveRes.data);
        setWordstatsVariations(availableNamesRes.data);
        setIsLoading(false);
      } catch (e) {
        if (isAxiosError(e)) setError(e);
      }
    })();
  }, [date, keyword]);

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
          label: 'Данные до',
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
          label: 'Данные после',
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
          label: 'Предсказание',
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

  const enterCumData = useMemo<ChartData<any, any, any>>(() => {
    const beforeStats = enterStats?.enterCum.before ?? [];
    const afterStats = enterStats?.enterCum.after ?? [];
    const predictStats = enterStats?.enterCum.predict ?? [];

    const labels = distinctConcatObjectArray(
      distinctConcatObjectArray(beforeStats, afterStats, 'date'),
      predictStats,
      'date',
    ).map(({ date }) => date);

    return {
      labels,
      datasets: [
        {
          label: 'Данные до',
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
          label: 'Данные после',
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
          label: 'Предсказание',
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

  const onSend = useCallback(() => {
    return undefined;
  }, []);

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
          label: 'Данные до',
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
          label: 'Данные после',
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
          label: 'Предсказание',
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
          label: 'Статистика поиска',
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

  const leaveCumData = useMemo<ChartData<any, any, any>>(() => {
    const beforeStats = leaveStats?.leaveCum.before ?? [];
    const afterStats = leaveStats?.leaveCum.after ?? [];
    const predictStats = leaveStats?.leaveCum.predict ?? [];

    const labels = distinctConcatObjectArray(distinctConcatObjectArray(beforeStats, afterStats, 'date'), predictStats, 'date')
      .map(({ date }) => date)
      .sort((a, b) => +new Date(a) - +new Date(b));

    return {
      labels,
      datasets: [
        {
          label: 'Данные до',
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
          label: 'Данные после',
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
          label: 'Предсказание',
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
  }, [leaveStats]);

  if (error) {
    return <Box>{error.message}</Box>;
  }
  return (
      <Box display="flex" flexDirection="column" gap={2} style={{ margin: '0 auto' }}>
        <StyledTypography color={'white'}>Система предиктивной аналитики рынка</StyledTypography>
        <InputBoxWrapper display="flex" gap={5} justifyContent={'space-between'} alignItems={'self-end'} top={30}>
          <BoxWrapper flexGrow={1}>
            <Typography variant="subtitle2" fontSize={20}>
              Дата начала прогноза
            </Typography>
            <DatePicker value={date} onChange={(value) => setDate(value)} minDate={new Date('2021-11-27')} />
          </BoxWrapper>
          <StyledButton disabled={!keyword} onClick={() => onSend()}>
            Запустить
          </StyledButton>
        </InputBoxWrapper>
        <InnerBlock>
          <BoxWrapper>
            <GraphWrap>
              <Typography variant="subtitle2">Гипотеза #1. Прогнозирование объёмов ввода товаров в оборот</Typography>
              <Line height={300} width={900} data={enterData} options={enterOptions} />
              <Typography variant="subtitle2">Гипотеза #1. Прогнозирование объёмов ввода товаров в оборот (накопительный)</Typography>
              <Line height={300} width={900} data={enterCumData} options={enterOptions} />
            </GraphWrap>
          </BoxWrapper>
          <InputBoxWrapper display="flex" gap={5} justifyContent={'space-between'} alignItems={'self-end'} bottom={15}>
            <BoxWrapper flexGrow={2}>
              <Typography variant="subtitle2" fontSize={20}>
                Дата начала прогноза
              </Typography>
              <DatePicker value={date} onChange={(value) => setDate(value)} minDate={new Date('2021-11-27')} />
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
                  value={wordstatsVariations.find(x => x.value === keyword)}
                  getOptionLabel={(option) => option.title}
                  renderInput={(params) => <TextField {...params} />}
                  options={wordstatsVariations}
              />
            </BoxWrapper>
            <StyledButton disabled={!keyword} onClick={() => onSend()}>
              Запустить
            </StyledButton>
          </InputBoxWrapper>
          <BoxWrapper>
            <GraphWrap>
              <Typography variant="subtitle2">Гипотеза #2. Прогнозирование спроса на товары</Typography>
              <Line height={300} width={900} data={leaveData} options={leaveOptions} />
              <Typography variant="subtitle2">Гипотеза #2. Прогнозирование спроса на товары (накопительный)</Typography>
              <Line height={300} width={900} data={leaveCumData} options={leaveOptions} />
            </GraphWrap>
          </BoxWrapper>
        </InnerBlock>
      </Box>
  )
};

export default Index;
