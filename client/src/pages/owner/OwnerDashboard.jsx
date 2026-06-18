import { useEffect, useState, useCallback } from 'react';
import {
  Box, Flex, Heading, Text, Button, Tabs, TabList, Tab, TabPanels, TabPanel,
  Spinner, Alert, AlertIcon
} from '@chakra-ui/react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { shopsService } from '../../services/shopsService';
import OwnerTabInfo from './OwnerTabInfo';
import OwnerTabProducts from './OwnerTabProducts';
import OwnerTabOrders from './OwnerTabOrders';
import OwnerTabPromotions from './OwnerTabPromotions';
import OwnerTabSummary from './OwnerTabSummary';
import OwnerTabBoletas from './OwnerTabBoletas';
import { PastelSkeletonCard } from '../../components/UI';

const TABS = ['info', 'products', 'orders', 'promotions', 'summary', 'boletas'];
const TAB_LABELS = { info: 'Información', products: 'Productos', orders: 'Órdenes', promotions: 'Promociones', summary: 'Resumen', boletas: 'Boletas' };

export default function OwnerDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [shops, setShops] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [tabIdx, setTabIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedShop = shops[selectedIdx];

  useEffect(() => {
    const load = async () => {
      try {
        const all = await shopsService.getByOwner(user?.uid);
        setShops(all?.data || []);
      } catch (e) { console.error(e); setError(e.message || 'Error al cargar pastelerías'); } finally { setLoading(false); }
    };
    load();
  }, [user]);

  const refreshShops = useCallback(async () => {
    try {
      const all = await shopsService.getByOwner(user?.uid);
      setShops(all?.data || []);
    } catch (e) { console.error(e); setError(e.message || 'Error al recargar'); }
  }, [user?.uid]);

  if (loading) {
    return (
      <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
        <PastelSkeletonCard />
        <PastelSkeletonCard />
      </Box>
    );
  }

  if (shops.length === 0) {
    return (
      <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
        <Flex direction="column" align="center" py={20} gap={3}>
          <Box as="svg" w="48px" h="48px" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </Box>
          <Text color="warmGray.400" fontSize="md">No tienes pastelerías registradas</Text>
          <Text color="warmGray.300" fontSize="sm">Solicita a un administrador que te asigne una pastelería</Text>
        </Flex>
      </Box>
    );
  }

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <Heading fontSize={{ base: '2xl', md: '3xl' }} fontWeight={700} color="brand.700" mb={1}>Panel de Dueño</Heading>
      <Text fontSize="sm" color="warmGray.400" mb={6}>Administra tus pastelerías, productos y órdenes</Text>
      <Box h="3px" w="60px" bgGradient="linear(90deg, accent.500, brand.500)" borderRadius="full" mb={6} />

      {error && <Alert status="error" mb={4} borderRadius="lg"><AlertIcon />{error}</Alert>}
      {success && <Alert status="success" mb={4} borderRadius="lg"><AlertIcon />{success}</Alert>}

      {shops.length > 1 && (
        <Flex gap={2} flexWrap="wrap" mb={5}>
          {shops.map((s, i) => (
            <Button key={s.id} size="sm"
              variant={selectedIdx === i ? 'solid' : 'outline'}
              colorScheme={selectedIdx === i ? 'accent' : undefined}
              bg={selectedIdx === i ? 'accent.500' : 'white'}
              color={selectedIdx === i ? 'white' : 'warmGray.600'}
              borderRadius="full"
              fontWeight={selectedIdx === i ? 600 : 500}
              onClick={() => { setSelectedIdx(i); setTabIdx(0); }}
            >
              {s.shopName}
            </Button>
          ))}
        </Flex>
      )}

      {selectedShop && (
        <Tabs
          variant="brand-underline"
          index={tabIdx}
          onChange={setTabIdx}
          mb={6}
          isLazy
        >
          <TabList>
            {TABS.map((t) => <Tab key={t} _focus={{ boxShadow: 'none' }}>{TAB_LABELS[t]}</Tab>)}
          </TabList>
          <TabPanels>
            <TabPanel px={0}><OwnerTabInfo selectedShop={selectedShop} setError={setError} setSuccess={setSuccess} onShopUpdate={refreshShops} /></TabPanel>
            <TabPanel px={0}><OwnerTabProducts selectedShop={selectedShop} setError={setError} setSuccess={setSuccess} /></TabPanel>
            <TabPanel px={0}><OwnerTabOrders selectedShop={selectedShop} setError={setError} setSuccess={setSuccess} /></TabPanel>
            <TabPanel px={0}><OwnerTabPromotions selectedShop={selectedShop} setError={setError} setSuccess={setSuccess} /></TabPanel>
            <TabPanel px={0}><OwnerTabSummary selectedShop={selectedShop} setError={setError} setSuccess={setSuccess} /></TabPanel>
            <TabPanel px={0}><OwnerTabBoletas selectedShop={selectedShop} setError={setError} setSuccess={setSuccess} /></TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Box>
  );
}
