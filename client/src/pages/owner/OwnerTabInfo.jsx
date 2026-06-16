import { useEffect, useState } from 'react';
import {
  Box, Flex, Grid, Text, Button, Input, Textarea, Card, useToast, SimpleGrid, FormLabel
} from '@chakra-ui/react';
import { shopsService } from '../../services/shopsService';
import ImageUploader from '../../components/ImageUploader';
import PropTypes from 'prop-types';

export default function OwnerTabInfo({ selectedShop, setError, setSuccess, onShopUpdate }) {
  const toast = useToast();
  const [shopForm, setShopForm] = useState({
    shopName: '', shopDescription: '', address: '', city: '', phone: '', email: '',
    deliveryRange: '', logoUrl: '', bannerUrl: '',
  });
  const [savingShop, setSavingShop] = useState(false);

  useEffect(() => {
    if (!selectedShop) return;
    setShopForm({
      shopName: selectedShop.shopName || '', shopDescription: selectedShop.shopDescription || '',
      address: selectedShop.address || '', city: selectedShop.city || '',
      phone: selectedShop.phone || '', email: selectedShop.email || '',
      deliveryRange: selectedShop.deliveryRange || '', logoUrl: selectedShop.logoUrl || '',
      bannerUrl: selectedShop.bannerUrl || '',
    });
    setError('');
    setSuccess('');
  }, [selectedShop]);

  const handleShopSave = async () => {
    setSavingShop(true);
    setError('');
    setSuccess('');
    try {
      await shopsService.update(selectedShop.id, shopForm);
      if (onShopUpdate) await onShopUpdate();
      setSuccess('Información actualizada');
    } catch (e) {
      console.error(e);
      setError('Error al guardar');
    } finally {
      setSavingShop(false);
    }
  };

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
      <Box>
        <Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>Nombre</Text>
        <Input size="sm" value={shopForm.shopName} onChange={(e) => setShopForm((p) => ({ ...p, shopName: e.target.value }))} />
      </Box>
      <Box>
        <Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>Ciudad</Text>
        <Input size="sm" value={shopForm.city} onChange={(e) => setShopForm((p) => ({ ...p, city: e.target.value }))} />
      </Box>
      <Box gridColumn={{ md: '1 / -1' }}>
        <Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>Descripción</Text>
        <Textarea size="sm" value={shopForm.shopDescription} onChange={(e) => setShopForm((p) => ({ ...p, shopDescription: e.target.value }))} minH="70px" />
      </Box>
      <Box>
        <Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>Dirección</Text>
        <Input size="sm" value={shopForm.address} onChange={(e) => setShopForm((p) => ({ ...p, address: e.target.value }))} />
      </Box>
      <Box>
        <Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>Teléfono</Text>
        <Input size="sm" value={shopForm.phone} onChange={(e) => setShopForm((p) => ({ ...p, phone: e.target.value }))} />
      </Box>
      <Box>
        <Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>Email</Text>
        <Input size="sm" value={shopForm.email} onChange={(e) => setShopForm((p) => ({ ...p, email: e.target.value }))} />
      </Box>
      <Box>
        <Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>Cobertura (km)</Text>
        <Input size="sm" value={shopForm.deliveryRange} onChange={(e) => setShopForm((p) => ({ ...p, deliveryRange: e.target.value }))} />
      </Box>
      <Box>
        <Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>Logo</Text>
        <ImageUploader folder="shops/logos" currentImageUrl={shopForm.logoUrl} onUploadComplete={(url) => setShopForm((p) => ({ ...p, logoUrl: url }))} label="Logo" aspectRatio="1/1" />
      </Box>
      <Box>
        <Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>Banner</Text>
        <ImageUploader folder="shops/banners" currentImageUrl={shopForm.bannerUrl} onUploadComplete={(url) => setShopForm((p) => ({ ...p, bannerUrl: url }))} label="Banner" aspectRatio="3/1" />
      </Box>
      <Box gridColumn={{ md: '1 / -1' }}>
        <Button colorScheme="brand" size="sm" onClick={handleShopSave} isDisabled={savingShop} mt={2}>
          {savingShop ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </Box>
    </SimpleGrid>
  );
}

OwnerTabInfo.propTypes = {
  selectedShop: PropTypes.object,
  setError: PropTypes.func,
  setSuccess: PropTypes.func,
  onShopUpdate: PropTypes.func,
};
