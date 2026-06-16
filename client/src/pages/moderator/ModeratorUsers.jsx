import { useEffect, useState } from 'react';
import {
  Box, Flex, Heading, Text, Button, Table, Thead, Tbody, Tr, Th, Td,
  Tag, Checkbox, Alert, AlertIcon, useToast, Card, HStack,
} from '@chakra-ui/react';
import ModeratorNav from './ModeratorNav';
import { usersService } from '../../services/usersService';
import { useAuth } from '../../context/AuthContext';

const ROLES = ['admin', 'moderator', 'owner', 'customer'];

const ROLE_BADGES = {
  admin:     { bg: '#fee2e2', color: '#ef4444' },
  moderator: { bg: '#e3f2fd', color: '#2196f3' },
  owner:     { bg: '#fff8e1', color: '#f59e0b' },
  customer:  { bg: '#e1f5ee', color: '#1D9E75' },
};

export default function ModeratorUsers() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editRoles, setEditRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('admin');

  const loadUsers = async () => {
    try { setLoading(true); const data = await usersService.getAll(); setUsers(data?.data || []); }
    catch (e) { console.error(e); setError('Error al cargar usuarios'); } finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleRoleToggle = (role) => {
    if (role === 'admin' && !isAdmin) return;
    const current = editRoles;
    const updated = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role];
    setEditRoles(updated.length ? updated : ['customer']);
  };

  const handleEdit = (u) => {
    setEditingId(u.id);
    setEditRoles(u.roles || ['customer']);
    setSuccess('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveRoles = async () => {
    setError('');
    setSuccess('');
    try { await usersService.update(editingId, { roles: editRoles }); setEditingId(null); setSuccess('Roles actualizados correctamente'); loadUsers(); }
    catch (e) { console.error(e); setError('Error al actualizar roles'); }
  };

  const handleCancel = () => { setEditingId(null); setEditRoles([]); };

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <Flex align="center" gap={4} mb={3} flexWrap="wrap">
        <Heading fontSize={{ base: 'xl', md: '3xl' }} fontWeight={700} color="brand.700">Usuarios</Heading>
        <Tag bg="white" color="warmGray.500" border="1px solid" borderColor="warmGray.200" borderRadius="full" fontSize="sm" fontWeight={500}>
          {users.length}
        </Tag>
      </Flex>

      <Box h="3px" w="60px" bgGradient="linear(90deg, accent.500, brand.500)" borderRadius="full" mb={4} />

      <ModeratorNav />

      {success && <Alert status="success" mt={4} mb={4} borderRadius="lg" borderLeft="4px solid" borderLeftColor="green.500">{success}</Alert>}
      {error && <Alert status="error" mt={4} mb={4} borderRadius="lg" borderLeft="4px solid" borderLeftColor="red.500">{error}</Alert>}

      {editingId && (
        <Card p={6} mt={4}>
          <Heading fontSize="lg" fontWeight={700} color="brand.700" mb={2}>Editar roles</Heading>
          <Box h="1px" bg="warmGray.200" my={4} />

          <Box mb={4}>
            <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={2}>Roles</Text>
            <HStack spacing={2} flexWrap="wrap">
              {ROLES.map((role) => {
                const rb = ROLE_BADGES[role];
                const selected = editRoles.includes(role);
                const isAdminRole = role === 'admin';
                const disabled = isAdminRole && !isAdmin;
                return (
                  <Tag
                    key={role}
                    as="label"
                    cursor={disabled ? 'not-allowed' : 'pointer'}
                    px={4} py={2} borderRadius="full"
                    bg={selected ? rb.bg : 'warmGray.50'}
                    border="1.5px solid"
                    borderColor={selected ? rb.color : 'warmGray.200'}
                    opacity={disabled ? 0.5 : 1}
                    transition="all 0.2s"
                    title={disabled ? 'Solo admins pueden asignar este rol' : role}
                  >
                    <Checkbox isChecked={selected} isDisabled={disabled} onChange={() => handleRoleToggle(role)} colorScheme="accent" me={1} />
                    {role}
                  </Tag>
                );
              })}
            </HStack>
            {!isAdmin && (
              <Text fontSize="xs" color="warmGray.400" mt={2}>
                No puedes asignar el rol <strong>admin</strong>.
              </Text>
            )}
          </Box>

          <HStack spacing={3}>
            <Button colorScheme="brand" onClick={handleSaveRoles}>Guardar roles</Button>
            <Button variant="ghost" onClick={handleCancel}>Cancelar</Button>
          </HStack>
        </Card>
      )}

      {loading ? (
        [1, 2, 3].map(i => <Box key={i} h="48px" bg="warmGray.100" borderRadius="lg" mt={4} mb={2} />)
      ) : (
        <Card mt={4} p={0} overflow="hidden">
          <Box overflowX="auto">
            <Table variant="pastel">
              <Thead>
                <Tr>
                  <Th>Nombre</Th>
                  <Th display={{ base: 'none', md: 'table-cell' }}>Email</Th>
                  <Th>Roles</Th>
                  <Th display={{ base: 'none', md: 'table-cell' }}>Estado</Th>
                  <Th>Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.length === 0 ? (
                  <Tr>
                    <Td colSpan={5} textAlign="center" py={12} color="warmGray.400">No hay usuarios registrados</Td>
                  </Tr>
                ) : (
                  users.map((u) => (
                    <Tr key={u.id} _hover={{ bg: 'warmGray.100' }}>
                      <Td fontWeight={500}>{u.full_name || '—'}</Td>
                      <Td display={{ base: 'none', md: 'table-cell' }} fontSize="sm">{u.email || '—'}</Td>
                      <Td>
                        <HStack spacing={1} flexWrap="wrap">
                          {(u.roles || []).map((r) => {
                            const rb = ROLE_BADGES[r] || ROLE_BADGES.customer;
                            return <Tag key={r} bg={rb.bg} color={rb.color} borderRadius="full" fontSize="xs" fontWeight={500}>{r}</Tag>;
                          })}
                        </HStack>
                      </Td>
                      <Td display={{ base: 'none', md: 'table-cell' }}>
                        <Tag borderRadius="full" fontSize="xs" fontWeight={500}
                          bg={u.isActive !== false ? 'green.50' : 'red.50'}
                          color={u.isActive !== false ? 'green.600' : 'red.600'}>
                          {u.isActive !== false ? 'Activo' : 'Inactivo'}
                        </Tag>
                      </Td>
                      <Td>
                        <Button size="xs" variant="ghost" onClick={() => handleEdit(u)}>Editar roles</Button>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        </Card>
      )}
    </Box>
  );
}
