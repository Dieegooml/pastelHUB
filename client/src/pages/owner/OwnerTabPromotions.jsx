import { useEffect, useState } from 'react';
import {
  Box, Flex, Text, Button, Input, Textarea, Select, Tag, Checkbox,
  useToast, Card, SimpleGrid, HStack, Grid
} from '@chakra-ui/react';
import { promotionsService } from '../../services/promotionsService';
import { formatDate, PROMO_TYPE_LABELS } from './ownerConstants';
import PropTypes from 'prop-types';

const INITIAL_PROMO_FORM = {
  promoName: '', promoType: 'discount', promoDescription: '',
  discountPercentage: '', discountAmount: '',
  comboItems: '', comboPrice: '',
  productIds: '', startDate: '', endDate: '', isActive: true,
};

export default function OwnerTabPromotions({ selectedShop, setError, setSuccess }) {
  const toast = useToast();
  const [promotions, setPromotions] = useState([]);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editPromoId, setEditPromoId] = useState(null);
  const [promoForm, setPromoForm] = useState(INITIAL_PROMO_FORM);
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => {
    if (!selectedShop?.id) return;
    promotionsService.getByShopAll(selectedShop.id)
      .then((res) => setPromotions(Array.isArray(res) ? res : res?.data || []))
      .catch((e) => console.error(e));
  }, [selectedShop]);

  const resetPromoForm = () => {
    setPromoForm(INITIAL_PROMO_FORM);
    setEditPromoId(null);
    setShowPromoForm(false);
  };

  const handlePromoSave = async () => {
    if (!promoForm.promoName) { setError('Nombre requerido'); return; }
    setError(''); setSuccess(''); setPromoLoading(true);
    try {
      const payload = {
        shop_id: selectedShop.id, name: promoForm.promoName, type: promoForm.promoType, description: promoForm.promoDescription,
        discount_percentage: promoForm.discountPercentage ? Number(promoForm.discountPercentage) : null,
        discount_amount: promoForm.discountAmount ? Number(promoForm.discountAmount) : null,
        combo_items: promoForm.comboItems ? promoForm.comboItems.split(',').map((s) => s.trim()).map((pid) => ({ product_id: pid })) : [],
        combo_price: promoForm.comboPrice ? Number(promoForm.comboPrice) : null,
        product_ids: promoForm.productIds ? promoForm.productIds.split(',').map((s) => s.trim()) : [],
        start_date: promoForm.startDate || new Date().toISOString().slice(0, 10),
        end_date: promoForm.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        is_active: promoForm.isActive,
      };
      if (editPromoId) { await promotionsService.update(editPromoId, payload); setSuccess('Promoción actualizada'); }
      else { await promotionsService.create(payload); setSuccess('Promoción creada'); }
      resetPromoForm();
      const res = await promotionsService.getByShopAll(selectedShop.id);
      setPromotions(Array.isArray(res) ? res : res?.data || []);
    } catch (e) { console.error(e); setError('Error al guardar promoción'); } finally { setPromoLoading(false); }
  };

  const handlePromoDelete = async (id) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    try { await promotionsService.delete(id); setSuccess('Promoción eliminada'); const res = await promotionsService.getByShopAll(selectedShop.id); setPromotions(Array.isArray(res) ? res : res?.data || []); }
    catch (e) { console.error(e); setError('Error al eliminar'); }
  };

  const handlePromoToggle = async (id) => {
    try { await promotionsService.toggle(id); const res = await promotionsService.getByShopAll(selectedShop.id); setPromotions(Array.isArray(res) ? res : res?.data || []); }
    catch (e) { console.error(e); setError('Error al cambiar estado'); }
  };

  const handleEditPromo = (p) => {
    setPromoForm({
      promoName: p.name || '', promoType: p.type || 'discount', promoDescription: p.description || '',
      discountPercentage: p.discount_percentage ?? '', discountAmount: p.discount_amount ?? '',
      comboItems: (p.combo_items || []).map((c) => c.product_id).join(', '), comboPrice: p.combo_price ?? '',
      productIds: (p.product_ids || []).join(', '), startDate: p.start_date ? p.start_date.slice(0, 10) : '',
      endDate: p.end_date ? p.end_date.slice(0, 10) : '', isActive: p.is_active !== false,
    });
    setEditPromoId(p.id);
    setShowPromoForm(true);
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="sm" color="warmGray.400">{promotions.length} {promotions.length === 1 ? 'promoción' : 'promociones'}</Text>
        <Button size="sm" colorScheme="brand" onClick={() => { resetPromoForm(); setShowPromoForm(!showPromoForm); }}>
          {showPromoForm ? 'Cancelar' : '+ Nueva promoción'}
        </Button>
      </Flex>

      {showPromoForm && (
        <Card p={5} mb={5}>
          <Text fontWeight={600} fontSize="md" color="brand.700" mb={4}>{editPromoId ? 'Editar promoción' : 'Nueva promoción'}</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box><Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>Nombre *</Text><Input size="sm" value={promoForm.promoName} onChange={(e) => setPromoForm((p) => ({ ...p, promoName: e.target.value }))} /></Box>
            <Box><Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>Tipo</Text>
              <Select size="sm" value={promoForm.promoType} onChange={(e) => setPromoForm((p) => ({ ...p, promoType: e.target.value }))}>
                {Object.entries(PROMO_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </Box>
            {promoForm.promoType === 'discount' && (
              <>
                <Box><Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>% Descuento</Text><Input size="sm" type="number" step="0.01" min="0" max="100" value={promoForm.discountPercentage} onChange={(e) => setPromoForm((p) => ({ ...p, discountPercentage: e.target.value }))} /></Box>
                <Box><Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>Monto fijo S/</Text><Input size="sm" type="number" step="0.01" min="0" value={promoForm.discountAmount} onChange={(e) => setPromoForm((p) => ({ ...p, discountAmount: e.target.value }))} /></Box>
              </>
            )}
            {promoForm.promoType === 'combo' && (
              <>
                <Box><Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>IDs de productos (separados por coma)</Text><Input size="sm" value={promoForm.comboItems} onChange={(e) => setPromoForm((p) => ({ ...p, comboItems: e.target.value }))} /></Box>
                <Box><Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>Precio combo S/</Text><Input size="sm" type="number" step="0.01" min="0" value={promoForm.comboPrice} onChange={(e) => setPromoForm((p) => ({ ...p, comboPrice: e.target.value }))} /></Box>
              </>
            )}
            <Box gridColumn={{ md: '1 / -1' }}><Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>Descripción</Text><Textarea size="sm" value={promoForm.promoDescription} onChange={(e) => setPromoForm((p) => ({ ...p, promoDescription: e.target.value }))} minH="50px" /></Box>
            <Box><Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>Inicio</Text><Input size="sm" type="date" value={promoForm.startDate} onChange={(e) => setPromoForm((p) => ({ ...p, startDate: e.target.value }))} /></Box>
            <Box><Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>Fin</Text><Input size="sm" type="date" value={promoForm.endDate} onChange={(e) => setPromoForm((p) => ({ ...p, endDate: e.target.value }))} /></Box>
            <Box><Text fontSize="xs" color="warmGray.500" textTransform="uppercase" letterSpacing="0.05em" fontWeight={600} mb={1}>IDs de productos (vacío = todos)</Text><Input size="sm" value={promoForm.productIds} onChange={(e) => setPromoForm((p) => ({ ...p, productIds: e.target.value }))} /></Box>
            <Box>
              <Checkbox isChecked={promoForm.isActive} onChange={(e) => setPromoForm((p) => ({ ...p, isActive: e.target.checked }))} colorScheme="accent" mt={6}>
                Activa
              </Checkbox>
            </Box>
          </SimpleGrid>
          <HStack spacing={3} mt={4}>
            <Button size="sm" colorScheme="brand" onClick={handlePromoSave} isDisabled={promoLoading}>
              {promoLoading ? 'Guardando...' : editPromoId ? 'Actualizar' : 'Crear promoción'}
            </Button>
            <Button size="sm" variant="ghost" onClick={resetPromoForm}>Cancelar</Button>
          </HStack>
        </Card>
      )}

      {promotions.length === 0 && !showPromoForm ? (
        <Box textAlign="center" py={10} color="warmGray.400" fontSize="sm">No hay promociones para esta pastelería. Crea tu primera promoción.</Box>
      ) : (
        <Flex direction="column" gap={3}>
          {promotions.map((p) => {
            const now = new Date();
            const end = new Date(p.end_date);
            const expired = end < now;
            const active = p.is_active && !expired;
            return (
              <Card key={p.id} p={4} opacity={active ? 1 : 0.6}>
                <Flex justify="space-between" align="center">
                  <Box>
                    <HStack spacing={2} mb={1} flexWrap="wrap">
                      <Text fontWeight={600} fontFamily="heading" color="brand.700">{p.name}</Text>
                      <Tag bg={p.type === 'discount' ? '#e3f2fd' : p.type === 'combo' ? '#fce4ec' : '#fff3e0'} color="warmGray.700" borderRadius="full" fontSize="xs">{PROMO_TYPE_LABELS[p.type] || p.type}</Tag>
                      {!p.is_active && <Tag bg="#fee2e2" color="#ef4444" borderRadius="full" fontSize="xs">Inactiva</Tag>}
                      {expired && <Tag bg="#f3f4f6" color="#999" borderRadius="full" fontSize="xs">Vencida</Tag>}
                      {active && <Tag bg="#d1fae5" color="#1D9E75" borderRadius="full" fontSize="xs">Activa</Tag>}
                    </HStack>
                    <Text fontSize="sm" color="warmGray.500" mb={1}>{p.description}</Text>
                    <HStack spacing={4} fontSize="xs" color="warmGray.400">
                      {p.discount_percentage != null && <Text>{p.discount_percentage}% descuento</Text>}
                      {p.discount_amount != null && <Text>S/ {p.discount_amount.toFixed(2)} descuento</Text>}
                      {p.combo_price != null && <Text>Combo S/ {p.combo_price.toFixed(2)}</Text>}
                      <Text>{formatDate(p.start_date)} → {formatDate(p.end_date)}</Text>
                    </HStack>
                  </Box>
                  <HStack spacing={1} flexShrink={0}>
                    <Button size="xs" variant="ghost" onClick={() => handlePromoToggle(p.id)}>{p.is_active ? 'Desactivar' : 'Activar'}</Button>
                    <Button size="xs" variant="ghost" onClick={() => handleEditPromo(p)}>Editar</Button>
                    <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handlePromoDelete(p.id)}>Eliminar</Button>
                  </HStack>
                </Flex>
              </Card>
            );
          })}
        </Flex>
      )}
    </Box>
  );
}

OwnerTabPromotions.propTypes = {
  selectedShop: PropTypes.object,
  setError: PropTypes.func,
  setSuccess: PropTypes.func,
};
