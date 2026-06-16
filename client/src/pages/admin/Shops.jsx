import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Flex, Heading, Text, Button, Input, Select, Textarea,
  Table, Thead, Tbody, Tr, Th, Td, Alert, AlertIcon, Tag,
  useToast, Stack, SimpleGrid, HStack
} from '@chakra-ui/react';
import AdminNav from './AdminNav';
import { PastelPageHeader, PastelCard, PastelStatusBadge, PastelSkeletonTable } from '../../components/UI';
import { shopsService } from '../../services/shopsService';
import { usersService } from '../../services/usersService';
import ImageUploader from '../../components/ImageUploader';

const emptyForm = {
  shopName: '', description: '', owner_id: '',
  address: '', city: '', phone: '', email: '',
  logoUrl: '', bannerUrl: '',
  approvalStatus: 'pending',
};

const STATUS_CONFIG = {
  approved:  { bg: '#e1f5ee', color: '#1D9E75' },
  pending:   { bg: '#fff8e1', color: '#f59e0b' },
  rejected:  { bg: '#fee2e2', color: '#ef4444' },
  suspended: { bg: '#f3f4f6', color: '#6b7280' },
};

export default function Shops() {
  const navigate = useNavigate();
  const toast = useToast();
  const [shops, setShops] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const ownerOptions = users.filter((u) => u.roles?.includes('owner'));

  useEffect(() => {
    const load = async () => {
      try {
        const data = await usersService.getAll();
        setUsers(data?.data || []);
      } catch (e) { console.error(e); } finally { setLoadingUsers(false); }
    };
    load();
  }, []);

  const loadShops = async () => {
    try {
      setLoading(true);
      const data = await shopsService.getAll();
      setShops(data?.data || []);
    } catch (e) {
      console.error(e);
      setError('Error al cargar pastelerías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadShops(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    try {
      if (editingId) {
        await shopsService.update(editingId, form);
        setEditingId(null);
      } else {
        await shopsService.create(form);
      }
      setForm(emptyForm);
      setSuccess(editingId ? 'Pastelería actualizada correctamente' : 'Pastelería creada correctamente');
      loadShops();
    } catch (e) {
      console.error(e);
      setError('Error al guardar la pastelería');
    }
  };

  const handleEdit = (shop) => {
    setEditingId(shop.id);
    setForm({
      shopName:       shop.shopName          || shop.shop_name || '',
      description:    shop.shopDescription   || shop.description || '',
      owner_id:       shop.owner_id           || '',
      address:        shop.address        || '',
      city:           shop.city           || '',
      phone:          shop.phone          || '',
      email:          shop.email          || '',
      logoUrl:        shop.logoUrl        || shop.logo_url || '',
      bannerUrl:      shop.bannerUrl      || shop.banner_url || '',
      approvalStatus: shop.approvalStatus || shop.approval_status || 'pending',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta pastelería? Esta acción no se puede deshacer.')) return;
    setError('');
    setSuccess('');
    try {
      await shopsService.delete(id);
      setSuccess('Pastelería eliminada correctamente');
      loadShops();
    } catch (e) {
      console.error(e);
      setError('Error al eliminar la pastelería');
    }
  };

  const handleCancel = () => { setEditingId(null); setForm(emptyForm); };

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <PastelPageHeader
        title="Pastelerías"
        actions={
          <Tag bg="white" color="warmGray.500" border="1px solid" borderColor="warmGray.200" borderRadius="full" fontSize="sm" fontWeight={500}>
            {shops.length}
          </Tag>
        }
      />

      <AdminNav />

      {success && <Alert status="success" mt={4} mb={4} borderRadius="lg" borderLeft="4px solid" borderLeftColor="green.500">{success}</Alert>}
      {error && <Alert status="error" mt={4} mb={4} borderRadius="lg" borderLeft="4px solid" borderLeftColor="red.500">{error}</Alert>}

      <PastelCard title={editingId ? 'Editar pastelería' : 'Nueva pastelería'} variant="elevated" mt={4}>
        <Box>
          <Text fontSize="sm" fontWeight={600} color="brand.700" mb={3}>Información básica</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
              <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={1}>Nombre de la pastelería *</Text>
              <Input name="shopName" value={form.shopName} onChange={handleChange} required placeholder="Ej: Dulce Tentación" />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={1}>Propietario *</Text>
              <Select name="owner_id" value={form.owner_id} onChange={handleChange} required placeholder={loadingUsers ? 'Cargando usuarios...' : 'Selecciona un dueño'}>
                {ownerOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.email} {u.email ? `(${u.email})` : ''}
                  </option>
                ))}
              </Select>
              {!loadingUsers && ownerOptions.length === 0 && (
                <Text fontSize="xs" color="warmGray.400" mt={1}>No hay usuarios con rol owner</Text>
              )}
            </Box>
            <Box gridColumn={{ md: '1 / -1' }}>
              <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={1}>Descripción</Text>
              <Textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe tu pastelería..." />
            </Box>
          </SimpleGrid>

          <Box h="1px" bg="warmGray.200" my={4} />

          <Text fontSize="sm" fontWeight={600} color="brand.700" mb={3}>Ubicación</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
              <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={1}>Dirección</Text>
              <Input name="address" value={form.address} onChange={handleChange} placeholder="Av. Principal 123" />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={1}>Ciudad</Text>
              <Input name="city" value={form.city} onChange={handleChange} placeholder="Lima" />
            </Box>
          </SimpleGrid>

          <Box h="1px" bg="warmGray.200" my={4} />

          <Text fontSize="sm" fontWeight={600} color="brand.700" mb={3}>Contacto</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
              <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={1}>Teléfono</Text>
              <Input name="phone" value={form.phone} onChange={handleChange} placeholder="+51 999 999 999" />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={1}>Email</Text>
              <Input type="email" name="email" value={form.email} onChange={handleChange} placeholder="contacto@ejemplo.com" />
            </Box>
          </SimpleGrid>

          <Box h="1px" bg="warmGray.200" my={4} />

          <Text fontSize="sm" fontWeight={600} color="brand.700" mb={3}>Imágenes</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
              <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={1}>Logo</Text>
              <ImageUploader folder="shops/logos" currentUrl={form.logoUrl} onUpload={(url) => setForm(p => ({ ...p, logoUrl: url }))} label="Logo" />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={1}>Banner</Text>
              <ImageUploader folder="shops/banners" currentUrl={form.bannerUrl} onUpload={(url) => setForm(p => ({ ...p, bannerUrl: url }))} label="Banner" />
            </Box>
          </SimpleGrid>

          <Box h="1px" bg="warmGray.200" my={4} />

          <Box maxW="280px">
            <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={1}>Estado de aprobación</Text>
            <Select name="approvalStatus" value={form.approvalStatus} onChange={handleChange}>
              <option value="pending">Pendiente</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
              <option value="suspended">Suspendido</option>
            </Select>
          </Box>

          <HStack spacing={3} mt={6}>
            <Button colorScheme="brand" onClick={handleSubmit}>
              {editingId ? 'Guardar cambios' : 'Crear pastelería'}
            </Button>
            {editingId && (
              <Button variant="ghost" onClick={handleCancel}>Cancelar</Button>
            )}
          </HStack>
        </Box>
      </PastelCard>

      {loading ? (
        <PastelSkeletonTable rows={5} cols={4} />
      ) : (
        <PastelCard mt={4} p={0} overflow="hidden">
          <Box overflowX="auto">
            <Table variant="pastel">
              <Thead>
                <Tr>
                  <Th>Nombre</Th>
                  <Th display={{ base: 'none', md: 'table-cell' }}>Ciudad</Th>
                  <Th>Estado</Th>
                  <Th>Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {shops.length === 0 ? (
                  <Tr>
                    <Td colSpan={4} textAlign="center" py={12} color="warmGray.400">No hay pastelerías registradas aún</Td>
                  </Tr>
                ) : (
                  shops.map((shop) => (
                    <Tr key={shop.id} _hover={{ bg: 'warmGray.100' }}>
                      <Td>
                        <Text fontWeight={500}>{shop.shopName}</Text>
                        {shop.shopDescription && (
                          <Text fontSize="xs" color="warmGray.400">{shop.shopDescription.slice(0, 50)}{shop.shopDescription.length > 50 ? '…' : ''}</Text>
                        )}
                      </Td>
                      <Td display={{ base: 'none', md: 'table-cell' }} fontSize="sm">{shop.city || '—'}</Td>
                      <Td>
                        <PastelStatusBadge status={shop.approvalStatus || 'pending'} />
                      </Td>
                      <Td>
                        <HStack spacing={2} flexWrap="wrap">
                          <Button size="xs" variant="ghost" onClick={() => handleEdit(shop)}>Editar</Button>
                          <Button size="xs" colorScheme="brand" variant="ghost" onClick={() => navigate(`/admin/shops/${shop.id}/products`)}>Productos</Button>
                          <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleDelete(shop.id)}>Eliminar</Button>
                        </HStack>
                      </Td>
                    </Tr>
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
