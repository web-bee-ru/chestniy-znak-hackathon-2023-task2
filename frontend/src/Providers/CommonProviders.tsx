import { PropChildren } from '@/src/types/UtilityProps';
import { cssReset } from '@/src/Css/CssReset';
import { GlobalStyles, Theme, ThemeProvider } from '@mui/material';

interface CommonProvidersProps extends PropChildren {
  theme: Theme;
}

const CommonProviders = ({ theme, children }: CommonProvidersProps) => {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles styles={cssReset} />
      {children}
    </ThemeProvider>
  );
};

export default CommonProviders;
