import { Box, styled } from '@mui/material';
import { PropChildren } from '@/src/types/UtilityProps';

const Container = styled(Box)`
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
`;

const ContentBox = styled(Box)`
  height: 100%;
  display: flex;
  background-color: #1d192b;
  overflow: auto;
  padding: ${({ theme }) => theme.spacing(5)};
`;

const DefaultLayout = ({ children }: PropChildren) => {
  return (
    <Container>
      <ContentBox>{children}</ContentBox>
    </Container>
  );
};

export default DefaultLayout;
