import type { AppProps } from 'next/app';
import CommonProviders from '@/src/Providers/CommonProviders';
import DefaultLayout from '@/src/layouts/DefaultLayout';
import defaultTheme from '@/src/const/defaultTheme';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CommonProviders theme={defaultTheme}>
      <DefaultLayout>
        <Component {...pageProps} />
      </DefaultLayout>
    </CommonProviders>
  );
}
