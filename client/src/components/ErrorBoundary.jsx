import { Component } from 'react';
import { Box, Flex, Text, Heading, Button } from '@chakra-ui/react';
import PropTypes from 'prop-types';

export default class ErrorBoundary extends Component {
  static propTypes = {
    children: PropTypes.node,
    fallback: PropTypes.node,
  };

  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Error capturado:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <Flex minH="100vh" align="center" justify="center" bg="warmGray.50" p={8}>
          <Box textAlign="center" maxW="400px">
            <Text fontSize="5xl" mb={4}>⚠️</Text>
            <Heading fontFamily="heading" fontSize="2xl" fontWeight={700} color="brand.900" mb={2}>
              Algo salió mal
            </Heading>
            <Text fontSize="sm" color="warmGray.500" mb={6} lineHeight={1.6}>
              Ocurrió un error inesperado. Intenta recargar la página.
            </Text>
            <Button
              variant="accent"
              size="lg"
              onClick={() => window.location.reload()}
            >
              Recargar página
            </Button>
          </Box>
        </Flex>
      );
    }

    return this.props.children;
  }
}
