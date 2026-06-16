import { useEffect, useState, useMemo } from 'react';
import {
  Box, Flex, HStack, VStack, Text, Heading, Button, Card, Badge, Spinner,
} from '@chakra-ui/react';
import { invoicesService } from '../../services/invoicesService';

const STATUS_COLORS = {
  issued: 'green',
  cancelled: 'red',
};

const STATUS_TRANS = { issued: 'Emitida', cancelled: 'Anulada' };

const formatDate = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await invoicesService.getAll();
        setInvoices(Array.isArray(res) ? res : res?.data || []);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return invoices;
    return invoices.filter((i) => i.status === filter);
  }, [invoices, filter]);

  const handleDownload = async (e, id) => {
    e.stopPropagation();
    setDownloading(id);
    try {
      await invoicesService.downloadPdf(id);
    } catch (err) {
      console.error('Error al descargar PDF:', err.message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Box maxW="800px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <Heading as="h2" fontFamily="heading" fontSize={{ base: '2xl', md: '3xl' }} fontWeight={700} color="brand.700" mb={6}>
        Mis Boletas
      </Heading>
      <Box h="3px" w="60px" bgGradient="linear(90deg, accent.500, brand.500)" borderRadius="full" mb={6} />

      <HStack spacing={2} mb={5} flexWrap="wrap">
        {['all', 'issued', 'cancelled'].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? 'primary' : 'outline'}
            borderColor={filter === s ? undefined : 'warmGray.300'}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'Todas' : STATUS_TRANS[s]}
          </Button>
        ))}
      </HStack>

      {loading ? (
        <VStack spacing={3}>
          {[1, 2, 3].map((i) => (
            <Box key={i} h="80px" w="full" bg="warmGray.200" borderRadius="xl" />
          ))}
        </VStack>
      ) : filtered.length === 0 ? (
        <VStack py={16} spacing={3}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <Text color="warmGray.400" fontSize="sm" fontFamily="body">
            {filter === 'all' ? 'No tienes boletas aún' : `No hay boletas ${STATUS_TRANS[filter]?.toLowerCase()}`}
          </Text>
        </VStack>
      ) : (
        <VStack spacing={3}>
          {filtered.map((inv) => (
            <Card
              key={inv.id}
              variant="interactive"
              p={4}
              w="full"
            >
              <Flex justify="space-between" align="center" flexDir={{ base: 'column', md: 'row' }} gap={{ base: 2, md: 0 }}>
                <Box flex={1} w={{ base: 'full', md: 'auto' }}>
                  <HStack spacing={2} mb={1}>
                    <Text fontFamily="monospace" fontSize="xs" fontWeight={700} color="accent.600">
                      {inv.invoiceNumber}
                    </Text>
                    <Text fontSize="xs" color="warmGray.800" fontWeight={500}>
                      {inv.shopName}
                    </Text>
                  </HStack>
                  <HStack spacing={3}>
                    <Text fontSize="xs" color="warmGray.400" fontFamily="body">
                      {formatDate(inv.issueDate)}
                    </Text>
                    <Heading as="span" fontFamily="heading" fontSize="md" fontWeight={700} color="brand.700">
                      S/ {(inv.total || 0).toFixed(2)}
                    </Heading>
                    <Badge colorScheme={STATUS_COLORS[inv.status] || 'gray'} variant="subtle" px={2} py={0.5} borderRadius="full" fontSize="xs">
                      {STATUS_TRANS[inv.status] || inv.status}
                    </Badge>
                  </HStack>
                </Box>
                <HStack spacing={2} flexShrink={0}>
                  {inv.status === 'issued' && (
                    <Button
                      size="xs"
                      variant="accent"
                      onClick={(e) => handleDownload(e, inv.id)}
                      isLoading={downloading === inv.id}
                      loadingText="Descargando..."
                    >
                      Descargar PDF
                    </Button>
                  )}
                  <Text color="warmGray.400" fontSize="lg">→</Text>
                </HStack>
              </Flex>
            </Card>
          ))}
        </VStack>
      )}
    </Box>
  );
}
