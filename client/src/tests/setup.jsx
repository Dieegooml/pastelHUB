import '@testing-library/jest-dom';
import { render as rtlRender } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import theme from '../styles/chakraTheme';

const AllTheProviders = ({ children }) => (
  <ChakraProvider theme={theme}>
    <MemoryRouter>
      {children}
    </MemoryRouter>
  </ChakraProvider>
);

const customRender = (ui, options) =>
  rtlRender(ui, { wrapper: AllTheProviders, ...options });

export { customRender as renderWithChakra };
