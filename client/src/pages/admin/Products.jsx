import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Flex, Heading, Text, Card, Button, Input, Select, Textarea,
  Table, Thead, Tbody, Tr, Th, Td, Tag, Alert, AlertIcon, useToast,
  Stack, SimpleGrid, HStack
} from '@chakra-ui/react';
import AdminNav from './AdminNav';
import { productsService } from '../../services/productsService';
import { shopsService } from '../../services/shopsService';
import ImageUploader from '../../components/ImageUploader';

const emptyForm = {
  category_id: '', name: '',
  description: '', price: '', stock: '',
  image_url: '', is_available: true,
};

const emptyVariant = { type: 'size', value: '', extra_price: '' };

export default function Products() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [variants, setVariants] = useState([]);
  const [variantForm, setVariantForm] = useState(emptyVariant);
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [showVariantPanel, setShowVariantPanel] = useState(false);

  const loadShop = async () => {
    try {
      const data = await shopsService.getById(shopId);
      setShop(data);
    } catch (e) {
      console.error(e);
      setError('Error al cargar la pastelería');
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsService.getByShop(shopId);
      setProducts(data?.data || []);
    } catch (e) {
      console.error(e);
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadShop(); loadProducts(); }, [shopId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    try {
      const payload = { ...form, shop_id: shopId };
      if (editingId) {
        await productsService.update(editingId, payload);
        setEditingId(null);
      } else {
        await productsService.create(payload);
      }
      setForm(emptyForm);
      setShowVariantPanel(false);
      setVariants([]);
      setSuccess(editingId ? 'Producto actualizado correctamente' : 'Producto creado correctamente');
      loadProducts();
    } catch (e) {
      console.error(e);
      setError('Error al guardar el producto');
    }
  };

  const handleEdit = async (product) => {
    setEditingId(product.id);
    setForm({
      category_id: product.category_id || '',
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      stock: product.stock || '',
      image_url: product.image_url || '',
      is_available: product.is_available !== undefined ? product.is_available : true,
    });
    setShowVariantPanel(true);
    try {
      const data = await productsService.getVariants(product.id);
      setVariants(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setVariants([]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    setError('');
    setSuccess('');
    try {
      await productsService.delete(id);
      setSuccess('Producto eliminado correctamente');
      loadProducts();
    } catch (e) {
      console.error(e);
      setError('Error al eliminar el producto');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowVariantPanel(false);
    setVariants([]);
    setEditingVariantId(null);
    setVariantForm(emptyVariant);
  };

  const handleToggleAvailability = async (id, current) => {
    try {
      await productsService.updateAvailability(id, !current);
      loadProducts();
    } catch (e) {
      console.error(e);
      setError('Error al cambiar disponibilidad');
    }
  };

  const handleVariantChange = (e) => setVariantForm({ ...variantForm, [e.target.name]: e.target.value });

  const handleAddVariant = async () => {
    if (!variantForm.value) return;
    try {
      if (editingVariantId) {
        await productsService.updateVariant(editingId, editingVariantId, variantForm);
      } else {
        await productsService.addVariant(editingId, variantForm);
      }
      setVariantForm(emptyVariant);
      setEditingVariantId(null);
      const data = await productsService.getVariants(editingId);
      setVariants(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError('Error al guardar variante');
    }
  };

  const handleEditVariant = (v) => {
    setEditingVariantId(v.variant_id);
    setVariantForm({ type: v.type, value: v.value, extra_price: v.extra_price });
  };

  const handleDeleteVariant = async (variantId) => {
    if (!confirm('¿Eliminar esta variante?')) return;
    try {
      await productsService.deleteVariant(editingId, variantId);
      const data = await productsService.getVariants(editingId);
      setVariants(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError('Error al eliminar variante');
    }
  };

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <Flex align="center" gap={4} mb={3} flexWrap="wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/shops')}>Volver</Button>
        <Heading fontSize={{ base: 'xl', md: '2xl' }} fontWeight={700} color="brand.700">
          {shop?.shopName || 'Cargando...'} — Productos
        </Heading>
        <Tag bg="white" color="warmGray.500" border="1px solid" borderColor="warmGray.200" borderRadius="full" fontSize="sm" fontWeight={500}>
          {products.length}
        </Tag>
      </Flex>

      <Box h="3px" w="60px" bgGradient="linear(90deg, accent.500, brand.500)" borderRadius="full" mb={4} />

      <AdminNav />

      {success && <Alert status="success" mt={4} mb={4} borderRadius="lg" borderLeft="4px solid" borderLeftColor="green.500">{success}</Alert>}
      {error && <Alert status="error" mt={4} mb={4} borderRadius="lg" borderLeft="4px solid" borderLeftColor="red.500">{error}</Alert>}

      <Card p={6} mt={4}>
        <Heading fontSize="lg" fontWeight={700} color="brand.700" mb={2}>
          {editingId ? 'Editar producto' : 'Nuevo producto'}
        </Heading>
        <Box h="1px" bg="warmGray.200" my={4} />

        <Box>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box gridColumn={{ md: '1 / -1' }}>
              <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={1}>Pastelería</Text>
              <Input value={shop?.shopName || ''} isDisabled />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={1}>Nombre del producto *</Text>
              <Input name="name" value={form.name} onChange={handleChange} required placeholder="Ej: Torta de Chocolate" />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={1}>Precio (S/) *</Text>
              <Input type="number" step="0.01" name="price" value={form.price} onChange={handleChange} required placeholder="0.00" />
            </Box>
          </SimpleGrid>

          <Box h="1px" bg="warmGray.200" my={4} />

          <Text fontSize="sm" fontWeight={600} color="brand.700" mb={3}>Detalles</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
              <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={1}>Categoría</Text>
              <Input name="category_id" value={form.category_id} onChange={handleChange} placeholder="ID de categoría" />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={1}>Stock</Text>
              <Input type="number" name="stock" value={form.stock} onChange={handleChange} placeholder="0" />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={1}>Disponible</Text>
              <Select name="is_available" value={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.value === 'true' })}>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </Select>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={1}>Imagen</Text>
              <ImageUploader folder="products" currentUrl={form.image_url} onUpload={(url) => setForm(p => ({ ...p, image_url: url }))} label="Producto" />
            </Box>
          </SimpleGrid>

          <Box h="1px" bg="warmGray.200" my={4} />

          <Box mb={4}>
            <Text fontSize="sm" fontWeight={500} color="warmGray.600" mb={1}>Descripción</Text>
            <Textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe el producto..." />
          </Box>

          <HStack spacing={3}>
            <Button colorScheme="brand" onClick={handleSubmit}>
              {editingId ? 'Guardar cambios' : 'Crear producto'}
            </Button>
            {editingId && (
              <Button variant="ghost" onClick={handleCancel}>Cancelar</Button>
            )}
          </HStack>
        </Box>
      </Card>

      {showVariantPanel && editingId && (
        <Card p={6} mt={4}>
          <Heading fontSize="lg" fontWeight={700} color="brand.700" mb={2}>Variantes</Heading>
          <Box h="1px" bg="warmGray.200" my={4} />

          <HStack spacing={3} align="flex-end" flexWrap="wrap">
            <Box minW="120px">
              <Text fontSize="xs" color="warmGray.500" mb={1}>Tipo</Text>
              <Select name="type" value={variantForm.type} onChange={handleVariantChange} size="sm">
                <option value="size">Tamaño</option>
                <option value="flavor">Sabor</option>
                <option value="decoration">Decoración</option>
              </Select>
            </Box>
            <Box minW="180px">
              <Text fontSize="xs" color="warmGray.500" mb={1}>Valor *</Text>
              <Input size="sm" name="value" value={variantForm.value} onChange={handleVariantChange} placeholder="Ej: Grande" />
            </Box>
            <Box minW="120px">
              <Text fontSize="xs" color="warmGray.500" mb={1}>Precio extra (S/)</Text>
              <Input size="sm" type="number" step="0.01" name="extra_price" value={variantForm.extra_price} onChange={handleVariantChange} placeholder="0.00" />
            </Box>
            <Button size="sm" colorScheme="brand" onClick={handleAddVariant}>
              {editingVariantId ? 'Actualizar' : 'Agregar'}
            </Button>
            {editingVariantId && (
              <Button size="sm" variant="ghost" onClick={() => { setEditingVariantId(null); setVariantForm(emptyVariant); }}>Cancelar</Button>
            )}
          </HStack>

          {variants.length > 0 && (
            <Box overflowX="auto" mt={4}>
              <Table variant="pastel" size="sm">
                <Thead>
                  <Tr>
                    <Th>Tipo</Th><Th>Valor</Th><Th>Extra</Th><Th>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {variants.map((v) => (
                    <Tr key={v.variant_id}>
                      <Td fontSize="sm">{v.type}</Td>
                      <Td fontSize="sm">{v.value}</Td>
                      <Td fontSize="sm">S/ {(v.extra_price || 0).toFixed(2)}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button size="xs" variant="ghost" onClick={() => handleEditVariant(v)}>Editar</Button>
                          <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleDeleteVariant(v.variant_id)}>Eliminar</Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
          {variants.length === 0 && <Text color="warmGray.400" fontSize="sm" mt={4}>Sin variantes aún</Text>}
        </Card>
      )}

      {loading ? (
        <Stack spacing={2} mt={4}>
          {[1, 2, 3].map(i => <Box key={i} h="48px" bg="warmGray.100" borderRadius="lg" />)}
        </Stack>
      ) : (
        <Card mt={4} p={0} overflow="hidden">
          <Box overflowX="auto">
            <Table variant="pastel">
              <Thead>
                <Tr>
                  <Th>Nombre</Th><Th>Precio</Th>
                  <Th display={{ base: 'none', md: 'table-cell' }}>Stock</Th>
                  <Th display={{ base: 'none', md: 'table-cell' }}>Disponible</Th>
                  <Th>Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {products.length === 0 ? (
                  <Tr>
                    <Td colSpan={5} textAlign="center" py={12} color="warmGray.400">No hay productos en esta pastelería aún</Td>
                  </Tr>
                ) : (
                  products.map((p) => {
                    const avBadge = p.is_available
                      ? { bg: '#e1f5ee', color: '#1D9E75', label: 'Disponible' }
                      : { bg: '#fee2e2', color: '#ef4444', label: 'No disponible' };
                    return (
                      <Tr key={p.id} _hover={{ bg: 'warmGray.100' }}>
                        <Td>
                          <Text fontWeight={500}>{p.name}</Text>
                          {p.description && <Text fontSize="xs" color="warmGray.400">{p.description.slice(0, 40)}{p.description.length > 40 ? '…' : ''}</Text>}
                        </Td>
                        <Td fontWeight={500}>S/ {(p.price || 0).toFixed(2)}</Td>
                        <Td display={{ base: 'none', md: 'table-cell' }}>{p.stock ?? '—'}</Td>
                        <Td display={{ base: 'none', md: 'table-cell' }}>
                          <Tag
                            cursor="pointer"
                            borderRadius="full"
                            fontSize="xs"
                            fontWeight={500}
                            bg={avBadge.bg}
                            color={avBadge.color}
                            onClick={() => handleToggleAvailability(p.id, p.is_available)}
                          >
                            {avBadge.label}
                          </Tag>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Button size="xs" variant="ghost" onClick={() => handleEdit(p)}>Editar</Button>
                            <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleDelete(p.id)}>Eliminar</Button>
                          </HStack>
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </Table>
          </Box>
        </Card>
      )}
    </Box>
  );
}
