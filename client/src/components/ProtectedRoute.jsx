import { Navigate } from 'react-router-dom';
import { Flex, Spinner, Text } from '@chakra-ui/react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Flex direction="column" align="center" justify="center" h="100vh" gap={4}>
        <Spinner size="lg" color="brand.500" thickness="3px" />
        <Text fontSize="sm" color="warmGray.500">Cargando...</Text>
      </Flex>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!roles.some(r => user.roles.includes(r))) return <Navigate to="/" />;
  }
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node,
  role: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
};

export default ProtectedRoute;
