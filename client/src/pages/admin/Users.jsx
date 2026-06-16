import { useEffect, useState, Fragment } from 'react';
import {
  Box, Flex, Heading, Text, Button, Input, Select, Badge,
  Table, Thead, Tbody, Tr, Th, Td, Alert, AlertIcon, useToast,
  Checkbox, Stack, HStack, Tag
} from '@chakra-ui/react';
import AdminNav from './AdminNav';
import { PastelPageHeader, PastelCard, PastelSkeletonTable } from '../../components/UI';
import { usersService } from '../../services/usersService';

const ROLES = ['admin', 'moderator', 'owner', 'customer'];

const emptyForm = {
  name: '', email: '', password: '', phone: '', roles: ['customer'],
};

const emptyAddress = { street: '', city: '', is_default: false };

const ROLE_BADGES = {
  admin:     { bg: '#fee2e2', color: '#ef4444' },
  moderator: { bg: '#e3f2fd', color: '#2196f3' },
  owner:     { bg: '#fff8e1', color: '#f59e0b' },
  customer:  { bg: '#e1f5ee', color: '#1D9E75' },
};

export default function Users() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [expandedUser, setExpandedUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingAddrId, setEditingAddrId] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersService.getAll();
      setUsers(data?.data || []);
    } catch (e) {
      console.error(e);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRoleToggle = (role) => {
    const current = form.roles;
    const updated = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role];
    setForm({ ...form, roles: updated.length ? updated : ['customer'] });
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    try {
      if (editingId) {
        await usersService.update(editingId, {
          full_name: form.name,
          phone: form.phone,
          roles: form.roles,
        });
        setEditingId(null);
      } else {
        await usersService.create(form);
      }
      setForm(emptyForm);
      setSuccess(editingId ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
      loadUsers();
    } catch (e) {
      console.error(e);
      setError('Error al guardar el usuario');
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setForm({
      name: user.full_name || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      roles: user.roles || ['customer'],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este usuario? También se eliminará de Firebase Auth.')) return;
    setError('');
    setSuccess('');
    try {
      await usersService.delete(id);
      setSuccess('Usuario eliminado correctamente');
      loadUsers();
    } catch (e) {
      console.error(e);
      setError('Error al eliminar el usuario');
    }
  };

  const handleCancel = () => { setEditingId(null); setForm(emptyForm); };

  const handleToggleStatus = async (id, current) => {
    try {
      await usersService.updateStatus(id, !current);
      setSuccess(`Usuario ${current ? 'desactivado' : 'activado'}`);
      loadUsers();
    } catch (e) {
      console.error(e);
      setError('Error al cambiar estado');
    }
  };

  const handleExpandUser = async (user) => {
    if (expandedUser === user.id) {
      setExpandedUser(null);
      return;
    }
    setExpandedUser(user.id);
    try {
      const data = await usersService.getAddresses(user.id);
      setAddresses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setAddresses([]);
    }
  };

  const handleAddrChange = (e) => setAddressForm({ ...addressForm, [e.target.name]: e.target.value });

  const handleAddrSubmit = async () => {
    if (!addressForm.street || !addressForm.city) return;
    try {
      if (editingAddrId) {
        await usersService.updateAddress(expandedUser, editingAddrId, addressForm);
      } else {
        await usersService.addAddress(expandedUser, addressForm);
      }
      setAddressForm(emptyAddress);
      setEditingAddrId(null);
      const data = await usersService.getAddresses(expandedUser);
      setAddresses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError('Error al guardar dirección');
    }
  };

  const handleEditAddr = (addr) => {
    setEditingAddrId(addr.address_id);
    setAddressForm({ street: addr.street, city: addr.city, is_default: addr.is_default });
  };

  const handleDeleteAddr = async (addrId) => {
    if (!confirm('¿Eliminar esta dirección?')) return;
    try {
      await usersService.deleteAddress(expandedUser, addrId);
      const data = await usersService.getAddresses(expandedUser);
      setAddresses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError('Error al eliminar dirección');
    }
  };

  const showAlert = (msg, type) => {
    toast({ title: msg, status: type, duration: 3000, isClosable: true, position: 'top-right' });
  };

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <PastelPageHeader
        title="Usuarios"
        actions={
          <Tag bg="white" color="warmGray.500" border="1px solid" borderColor="warmGray.200" borderRadius="full" fontSize="sm" fontWeight={500}>
            {users.length}
          </Tag>
        }
      />

      <AdminNav />

      {success && <Alert status="success" mt={4} mb={4} borderRadius="lg" borderLeft="4px solid" borderLeftColor="green.500">{success}</Alert>}
      {error && <Alert status="error" mt={4} mb={4} borderRadius="lg" borderLeft="4px solid" borderLeftColor="red.500">{error}</Alert>}

      <PastelCard title={editingId ? 'Editar usuario' : 'Nuevo usuario'} variant="elevated" mt={4}>
        <Box>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={4}>
            <Box flex={1}>
              <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={1}>Nombre completo *</Text>
              <Input name="name" value={form.name} onChange={handleChange} required={!editingId} placeholder="Juan Pérez" />
            </Box>
            <Box flex={1}>
              <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={1}>Correo electrónico *</Text>
              <Input type="email" name="email" value={form.email} onChange={handleChange} required={!editingId} isDisabled={!!editingId} placeholder="correo@ejemplo.com" />
            </Box>
          </Stack>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={4}>
            <Box flex={1}>
              <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={1}>{editingId ? 'Contraseña (dejar vacío)' : 'Contraseña *'}</Text>
              <Input type="password" name="password" value={form.password} onChange={handleChange} required={!editingId} placeholder={editingId ? '••••••••' : 'Mínimo 8 caracteres'} />
            </Box>
            <Box flex={1}>
              <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={1}>Teléfono</Text>
              <Input name="phone" value={form.phone} onChange={handleChange} placeholder="+51 999 999 999" />
            </Box>
          </Stack>

          <Box h="1px" bg="warmGray.200" my={4} />

          <Box mb={4}>
            <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={2}>Roles</Text>
            <HStack spacing={2} flexWrap="wrap">
              {ROLES.map((role) => {
                const rb = ROLE_BADGES[role];
                const selected = form.roles.includes(role);
                return (
                  <Tag
                    key={role}
                    as="label"
                    cursor="pointer"
                    px={4}
                    py={2}
                    borderRadius="full"
                    bg={selected ? rb.bg : 'warmGray.50'}
                    border="1.5px solid"
                    borderColor={selected ? rb.color : 'warmGray.200'}
                    transition="all 0.2s"
                    fontWeight={500}
                    fontSize="sm"
                    _hover={{ opacity: 0.8 }}
                  >
                    <Checkbox
                      isChecked={selected}
                      onChange={() => handleRoleToggle(role)}
                      colorScheme="accent"
                      me={1}
                    />
                    {role}
                  </Tag>
                );
              })}
            </HStack>
          </Box>

          <HStack spacing={3} mt={4}>
            <Button colorScheme="brand" onClick={handleSubmit}>
              {editingId ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
            {editingId && (
              <Button variant="ghost" onClick={handleCancel}>Cancelar</Button>
            )}
          </HStack>
        </Box>
      </PastelCard>

      {loading ? (
        <PastelSkeletonTable rows={5} cols={6} />
      ) : (
        <PastelCard mt={4} p={0} overflow="hidden">
          <Box overflowX="auto">
            <Table variant="pastel">
              <Thead>
                <Tr>
                  <Th>Nombre</Th>
                  <Th display={{ base: 'none', md: 'table-cell' }}>Email</Th>
                  <Th display={{ base: 'none', md: 'table-cell' }}>UID</Th>
                  <Th>Roles</Th>
                  <Th display={{ base: 'none', md: 'table-cell' }}>Estado</Th>
                  <Th>Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.length === 0 ? (
                  <Tr>
                    <Td colSpan={6} textAlign="center" py={12} color="warmGray.400">No hay usuarios registrados</Td>
                  </Tr>
                ) : (
                  users.map((u) => (
                    <Fragment key={u.id}>
                      <Tr
                        _hover={{ bg: 'warmGray.100' }}
                        cursor="pointer"
                        onClick={() => handleExpandUser(u)}
                      >
                        <Td>
                          <Text fontWeight={500}>{u.full_name || '—'}</Text>
                          <Text as="span" fontSize="xs" color="warmGray.400" ms={1}>
                            {expandedUser === u.id ? '▲' : '▼'}
                          </Text>
                        </Td>
                        <Td display={{ base: 'none', md: 'table-cell' }} fontSize="sm">{u.email || '—'}</Td>
                        <Td display={{ base: 'none', md: 'table-cell' }}>
                          <Text
                            fontSize="xs" fontFamily="mono" color="warmGray.400" cursor="pointer" userSelect="all"
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(u.id); setSuccess('UID copiado'); }}
                            title="Click para copiar"
                          >
                            {u.id ? `${u.id.slice(0, 12)}...` : '—'}
                          </Text>
                        </Td>
                        <Td>
                          <HStack spacing={1} flexWrap="wrap">
                            {(u.roles || []).map((r) => {
                              const rb = ROLE_BADGES[r] || ROLE_BADGES.customer;
                              return (
                                <Tag key={r} bg={rb.bg} color={rb.color} borderRadius="full" fontSize="xs" fontWeight={500}>
                                  {r}
                                </Tag>
                              );
                            })}
                          </HStack>
                        </Td>
                        <Td display={{ base: 'none', md: 'table-cell' }}>
                          <Tag
                            cursor="pointer"
                            borderRadius="full"
                            fontSize="xs"
                            fontWeight={500}
                            bg={u.isActive !== false ? 'green.50' : 'red.50'}
                            color={u.isActive !== false ? 'green.600' : 'red.600'}
                            onClick={(e) => { e.stopPropagation(); handleToggleStatus(u.id, u.isActive !== false); }}
                          >
                            {u.isActive !== false ? 'Activo' : 'Inactivo'}
                          </Tag>
                        </Td>
                        <Td onClick={(e) => e.stopPropagation()}>
                          <HStack spacing={2}>
                            <Button size="xs" variant="ghost" onClick={() => handleEdit(u)}>Editar</Button>
                            <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleDelete(u.id)}>Eliminar</Button>
                          </HStack>
                        </Td>
                      </Tr>
                      {expandedUser === u.id && (
                        <Tr>
                          <Td colSpan={6} bg="warmGray.50" p={4}>
                            <Box borderTop="1px solid" borderColor="warmGray.200" pt={4}>
                              <Heading fontSize="md" color="brand.700" mb={3}>Direcciones</Heading>

                              <Stack direction={{ base: 'column', md: 'row' }} spacing={2} mb={3} align="flex-end" flexWrap="wrap">
                                <Box>
                                  <Text fontSize="xs" color="warmGray.500" mb={1}>Calle *</Text>
                                  <Input size="sm" name="street" value={addressForm.street} onChange={handleAddrChange} placeholder="Av. Principal 123" w={{ base: '100%', md: '180px' }} />
                                </Box>
                                <Box>
                                  <Text fontSize="xs" color="warmGray.500" mb={1}>Ciudad *</Text>
                                  <Input size="sm" name="city" value={addressForm.city} onChange={handleAddrChange} placeholder="Lima" w={{ base: '100%', md: '120px' }} />
                                </Box>
                                <Checkbox
                                  isChecked={addressForm.is_default}
                                  onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                                  colorScheme="accent"
                                  fontSize="sm"
                                >
                                  Default
                                </Checkbox>
                                <Button size="sm" colorScheme="brand" onClick={handleAddrSubmit}>
                                  {editingAddrId ? 'Actualizar' : 'Agregar'}
                                </Button>
                                {editingAddrId && (
                                  <Button size="sm" variant="ghost" onClick={() => { setEditingAddrId(null); setAddressForm(emptyAddress); }}>
                                    Cancelar
                                  </Button>
                                )}
                              </Stack>

                              {addresses.length === 0 ? (
                                <Text color="warmGray.400" fontSize="sm">Sin direcciones registradas</Text>
                              ) : (
                                <Table variant="pastel" size="sm">
                                  <Thead>
                                    <Tr>
                                      <Th>Calle</Th>
                                      <Th>Ciudad</Th>
                                      <Th>Default</Th>
                                      <Th>Acciones</Th>
                                    </Tr>
                                  </Thead>
                                  <Tbody>
                                    {addresses.map((a) => (
                                      <Tr key={a.address_id}>
                                        <Td fontSize="sm">{a.street}</Td>
                                        <Td fontSize="sm">{a.city}</Td>
                                        <Td fontSize="sm">{a.is_default ? '✅' : '—'}</Td>
                                        <Td>
                                          <HStack spacing={2}>
                                            <Button size="xs" variant="ghost" onClick={() => handleEditAddr(a)}>Editar</Button>
                                            <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleDeleteAddr(a.address_id)}>Eliminar</Button>
                                          </HStack>
                                        </Td>
                                      </Tr>
                                    ))}
                                  </Tbody>
                                </Table>
                              )}
                            </Box>
                          </Td>
                        </Tr>
                      )}
                    </Fragment>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        </PastelCard>
      )}
    </Box>
  );
}
