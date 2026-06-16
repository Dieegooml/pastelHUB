import { useEffect, useState } from 'react';
import {
  Box, Flex, Text, Button, Input, Textarea, Table, Thead, Tbody, Tr, Th, Td,
  Tag, Checkbox, useToast, Card, SimpleGrid, HStack
} from '@chakra-ui/react';
import { productsService } from '../../services/productsService';
import ImageUploader from '../../components/ImageUploader';
import PropTypes from 'prop-types';

export default function OwnerTabProducts({ selectedShop, setError, setSuccess }) {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    productName: '', productDescription: '', price: '', stock: '', categoryId: '', imageUrl: '', isAvailable: true,
  });

  useEffect(() => {
    if (!selectedShop?.id) return;
    productsService.getByShop(selectedShop.id).then((data) => setProducts(data?.data || [])).catch((e) => console.error(e));
  }, [selectedShop]);

  const resetProductForm = () => {
    setProductForm({ productName: '', productDescription: '', price: '', stock: '', categoryId: '', imageUrl: '', isAvailable: true });
    setEditProductId(null);
    setShowProductForm(false);
  };

  const handleProductSave = async () => {
    if (!productForm.productName || !productForm.price) { setError('Nombre y precio obligatorios'); return; }
    setError(''); setSuccess('');
    try {
      const payload = { ...productForm, shop_id: selectedShop.id, price: Number(productForm.price), stock: productForm.stock ? Number(productForm.stock) : 0 };
      if (editProductId) { await productsService.update(editProductId, payload); setSuccess('Producto actualizado'); }
      else { await productsService.create(payload); setSuccess('Producto creado'); }
      resetProductForm();
      const data = await productsService.getByShop(selectedShop.id);
      setProducts(data?.data || []);
    } catch (e) { console.error(e); setError('Error al guardar producto'); }
  };

  const handleProductDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try { await productsService.delete(id); setSuccess('Producto eliminado'); const data = await productsService.getByShop(selectedShop.id); setProducts(data?.data || []); }
    catch (e) { console.error(e); setError('Error al eliminar'); }
  };

  const handleEditProduct = (p) => {
    setProductForm({
      productName: p.productName || p.name || '', productDescription: p.productDescription || p.description || '',
      price: p.price || '', stock: p.stock || '', categoryId: p.categoryId || p.category_id || '',
      imageUrl: p.imageUrl || p.image_url || '', isAvailable: p.isAvailable !== false,
    });
    setEditProductId(p.id);
    setShowProductForm(true);
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="sm" color="warmGray.400">{products.length} {products.length === 1 ? 'producto' : 'productos'}</Text>
        <Button size="sm" colorScheme="brand" onClick={() => { resetProductForm(); setShowProductForm(!showProductForm); }}>
          {showProductForm ? 'Cancelar' : '+ Nuevo producto'}
        </Button>
      </Flex>

      {showProductForm && (
        <Card p={5} mb={5}>
          <Text fontWeight={600} fontSize="md" color="brand.700" mb={4}>{editProductId ? 'Editar producto' : 'Nuevo producto'}</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box><Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>Nombre *</Text><Input size="sm" value={productForm.productName} onChange={(e) => setProductForm((p) => ({ ...p, productName: e.target.value }))} /></Box>
            <Box><Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>Precio S/ *</Text><Input size="sm" type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))} /></Box>
            <Box><Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>Stock</Text><Input size="sm" type="number" value={productForm.stock} onChange={(e) => setProductForm((p) => ({ ...p, stock: e.target.value }))} /></Box>
            <Box><Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>Categoría</Text><Input size="sm" value={productForm.categoryId} onChange={(e) => setProductForm((p) => ({ ...p, categoryId: e.target.value }))} /></Box>
            <Box gridColumn={{ md: '1 / -1' }}><Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>Descripción</Text><Textarea size="sm" value={productForm.productDescription} onChange={(e) => setProductForm((p) => ({ ...p, productDescription: e.target.value }))} minH="50px" /></Box>
            <Box gridColumn={{ md: '1 / -1' }}><Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>Imagen</Text><ImageUploader folder="products" currentImageUrl={productForm.imageUrl} onUploadComplete={(url) => setProductForm((p) => ({ ...p, imageUrl: url }))} label="Producto" aspectRatio="1/1" /></Box>
            <Box gridColumn={{ md: '1 / -1' }}>
              <Checkbox isChecked={productForm.isAvailable} onChange={(e) => setProductForm((p) => ({ ...p, isAvailable: e.target.checked }))} colorScheme="accent">
                Producto disponible
              </Checkbox>
            </Box>
          </SimpleGrid>
          <HStack spacing={3} mt={4}>
            <Button size="sm" colorScheme="brand" onClick={handleProductSave}>{editProductId ? 'Actualizar' : 'Crear producto'}</Button>
            <Button size="sm" variant="ghost" onClick={resetProductForm}>Cancelar</Button>
          </HStack>
        </Card>
      )}

      {products.length === 0 && !showProductForm ? (
        <Box textAlign="center" py={10} color="warmGray.400" fontSize="sm">Aún no tienes productos. Crea tu primer producto.</Box>
      ) : (
        <Card p={0} overflow="hidden">
          <Box overflowX="auto">
            <Table variant="pastel">
              <Thead>
                <Tr><Th>Nombre</Th><Th>Precio</Th><Th>Stock</Th><Th>Disponible</Th><Th>Acciones</Th></Tr>
              </Thead>
              <Tbody>
                {products.map((p) => (
                  <Tr key={p.id} _hover={{ bg: 'warmGray.100' }}>
                    <Td fontSize="sm">{p.productName || p.name}</Td>
                    <Td fontSize="sm" fontWeight={600} color="accent.500">S/ {(p.price || 0).toFixed(2)}</Td>
                    <Td fontSize="sm">{p.stock ?? '—'}</Td>
                    <Td fontSize="sm">{p.isAvailable !== false ? '✅' : '❌'}</Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button size="xs" variant="ghost" onClick={() => handleEditProduct(p)}>Editar</Button>
                        <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleProductDelete(p.id)}>Eliminar</Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Card>
      )}
    </Box>
  );
}

OwnerTabProducts.propTypes = {
  selectedShop: PropTypes.object,
  setError: PropTypes.func,
  setSuccess: PropTypes.func,
};
