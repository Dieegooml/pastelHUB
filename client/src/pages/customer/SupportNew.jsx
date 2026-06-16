import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Flex, VStack, Text, Heading, Button, Input, Select,
  Textarea, Card, FormControl, FormLabel,
} from '@chakra-ui/react';
import { supportService } from '../../services/supportService';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
];

export default function SupportNew() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('medium');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) { setError('Completa todos los campos'); return; }
    setLoading(true);
    setError('');
    try {
      await supportService.createTicket({ subject: subject.trim(), priority, message: message.trim() });
      navigate('/support');
    } catch (e) { console.error(e); setError('Error al crear ticket'); }
    finally { setLoading(false); }
  };

  return (
    <Box maxW="700px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <Flex align="center" gap={3} mb={6}>
        <Button
          variant="outline"
          borderColor="warmGray.300"
          size="sm"
          onClick={() => navigate('/support')}
          leftIcon={<Box as="span">←</Box>}
        >
          Volver
        </Button>
        <Heading as="h2" fontFamily="heading" fontSize={{ base: '2xl', md: '2xl' }} fontWeight={700} color="brand.700">
          Nuevo ticket
        </Heading>
      </Flex>

      <Card variant="elevated" p={6}>
        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel fontSize="xs" fontWeight={600} color="warmGray.700" fontFamily="body">
              Asunto *
            </FormLabel>
            <Input
              size="md"
              fontSize="sm"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej: Problema con mi pedido"
            />
          </FormControl>

          <FormControl>
            <FormLabel fontSize="xs" fontWeight={600} color="warmGray.700" fontFamily="body">
              Prioridad
            </FormLabel>
            <Select size="md" fontSize="sm" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="xs" fontWeight={600} color="warmGray.700" fontFamily="body">
              Mensaje *
            </FormLabel>
            <Textarea
              fontSize="sm"
              minH="140px"
              resize="vertical"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe tu problema o consulta..."
            />
          </FormControl>

          {error && (
            <Box bg="rose.50" color="rose.500" p={3} borderRadius="lg" fontSize="sm" fontFamily="body" borderLeft="4px" borderLeftColor="rose.500">
              {error}
            </Box>
          )}

          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={loading}
            loadingText="Enviando..."
            alignSelf="flex-start"
          >
            Enviar ticket
          </Button>
        </VStack>
      </Card>
    </Box>
  );
}
