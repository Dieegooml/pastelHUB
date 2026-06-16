import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import {
  Box, Flex, HStack, VStack, Text, Button, Input,
  Avatar, Tag, Badge, Checkbox,
} from '@chakra-ui/react';
import { useAuth } from '../../context/AuthContext';
import { usersService } from '../../services/usersService';
import ImageUploader from '../../components/ImageUploader';
import {
  PastelPageHeader, PastelCard, PastelSkeletonPage,
} from '../../components/UI';

const ROLE_COLORS = {
  admin: { colorScheme: 'red' },
  moderator: { colorScheme: 'blue' },
  owner: { colorScheme: 'orange' },
  customer: { colorScheme: 'green' },
};

const ROLE_LABELS = {
  admin: 'Administrador',
  moderator: 'Moderador',
  owner: 'Dueño',
  customer: 'Cliente',
};

function AddressForm({ initial, onSave, onCancel }) {
  const [street, setStreet] = useState(initial?.street || '');
  const [city, setCity] = useState(initial?.city || '');
  const [isDefault, setIsDefault] = useState(initial?.is_default || false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!street || !city) return;
    setSaving(true);
    try {
      await onSave({ street, city, is_default: isDefault });
    } finally { setSaving(false); }
  };

  return (
    <Box bg="warmGray.100" borderRadius="lg" p={4} mt={2}>
      <Text fontSize="xs" fontWeight={600} color="warmGray.600" fontFamily="body" mb={1}>Calle / Dirección</Text>
      <Input size="sm" fontSize="xs" mb={2.5} value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Av. Principal 123" />
      <Text fontSize="xs" fontWeight={600} color="warmGray.600" fontFamily="body" mb={1}>Ciudad</Text>
      <Input size="sm" fontSize="xs" mb={2.5} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lima" />
      <Checkbox isChecked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} size="sm" colorScheme="brand" mb={2}>
        <Text fontSize="xs">Dirección por defecto</Text>
      </Checkbox>
      <HStack spacing={2} mt={3}>
        <Button size="sm" variant="primary" onClick={handleSubmit} isLoading={saving} isDisabled={!street || !city}>
          Guardar
        </Button>
        <Button size="sm" variant="secondary" onClick={onCancel}>Cancelar</Button>
      </HStack>
    </Box>
  );
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState({ name: false, phone: false });

  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const loadProfile = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const u = await usersService.getById(user.uid);
      if (u) {
        setFullName(u.full_name || '');
        setPhone(u.phone || '');
        setPhotoUrl(u.photo_url || '');
        setAddresses(u.addresses || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSaveName = async () => {
    if (!user?.uid || !fullName.trim()) return;
    setSaving((s) => ({ ...s, name: true }));
    setError('');
    setSuccess('');
    try {
      await usersService.update(user.uid, { full_name: fullName.trim() });
      setSuccess('Nombre actualizado');
      await refreshUser();
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al actualizar nombre');
    } finally { setSaving((s) => ({ ...s, name: false })); }
  };

  const handleSavePhone = async () => {
    if (!user?.uid) return;
    setSaving((s) => ({ ...s, phone: true }));
    setError('');
    setSuccess('');
    try {
      await usersService.update(user.uid, { phone });
      setSuccess('Teléfono actualizado');
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al actualizar teléfono');
    } finally { setSaving((s) => ({ ...s, phone: false })); }
  };

  const handlePhotoUpload = async (url) => {
    setPhotoUrl(url);
    if (!url) {
      try {
        await usersService.update(user.uid, { photo_url: '' });
      } catch (e) { console.error(e); }
      return;
    }
    setError('');
    setSuccess('');
    try {
      await usersService.update(user.uid, { photo_url: url });
      setSuccess('Foto de perfil actualizada');
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al actualizar foto');
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await updatePassword(auth.currentUser, newPassword);
      setNewPassword('');
      setSuccess('Contraseña actualizada');
    } catch (e) { console.error(e);
      setError('Error al actualizar contraseña. Puede que necesites volver a iniciar sesión.');
    }
  };

  const handleAddAddress = async (data) => {
    try {
      await usersService.addAddress(user.uid, data);
      setShowAddressForm(false);
      await loadProfile();
      setSuccess('Dirección agregada');
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al agregar dirección');
    }
  };

  const handleUpdateAddress = async (data) => {
    try {
      await usersService.updateAddress(user.uid, editingAddress.address_id, data);
      setEditingAddress(null);
      await loadProfile();
      setSuccess('Dirección actualizada');
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al actualizar dirección');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('¿Eliminar esta dirección?')) return;
    try {
      await usersService.deleteAddress(user.uid, addressId);
      await loadProfile();
      setSuccess('Dirección eliminada');
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al eliminar dirección');
    }
  };

  return (
    <Box maxW="600px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <PastelPageHeader title="Mi Perfil" icon="👤" />

      {loading ? (
        <PastelSkeletonPage cards={3} />
      ) : (
        <>
          {error && (
            <Box bg="rose.50" color="rose.500" p={3} borderRadius="lg" mb={4} fontSize="sm" fontFamily="body" borderLeft="4px" borderLeftColor="rose.500">
              {error}
            </Box>
          )}
          {success && (
            <Box bg="green.50" color="green.700" p={3} borderRadius="lg" mb={4} fontSize="sm" fontFamily="body" borderLeft="4px" borderLeftColor="green.500">
              {success}
            </Box>
          )}

          <PastelCard variant="elevated">
            <HStack spacing={4} mb={5}>
              {photoUrl ? (
                <Avatar src={photoUrl} name="Foto de perfil" w="56px" h="56px" border="2px" borderColor="warmGray.300" />
              ) : (
                <Flex
                  w="56px" h="56px" borderRadius="full"
                  bg="brand.700" color="#fff"
                  align="center" justify="center"
                  fontSize="2xl" fontWeight={700} fontFamily="heading"
                  flexShrink={0}
                >
                  {user?.email?.charAt(0).toUpperCase() || '?'}
                </Flex>
              )}
              <Box flex={1}>
                <Text fontSize="md" fontWeight={600} fontFamily="body" color="warmGray.800">
                  {fullName || user?.displayName || 'Sin nombre'}
                </Text>
                <Text fontSize="xs" color="warmGray.500" fontFamily="body">{user?.email}</Text>
              </Box>
            </HStack>
            <Box mb={3}>
              <ImageUploader
                folder="profiles"
                currentImageUrl={photoUrl}
                onUploadComplete={handlePhotoUpload}
                label="Foto de perfil"
                aspectRatio="1/1"
              />
            </Box>
            <HStack spacing={2} flexWrap="wrap">
              {user?.roles?.map((role) => {
                const rc = ROLE_COLORS[role] || { colorScheme: 'gray' };
                return (
                  <Tag key={role} colorScheme={rc.colorScheme} variant="subtle" borderRadius="full" size="sm">
                    {ROLE_LABELS[role] || role}
                  </Tag>
                );
              })}
            </HStack>
          </PastelCard>

          <PastelCard title="Información personal" variant="elevated">
            <Box mb={3.5}>
              <Text fontSize="xs" fontWeight={600} color="warmGray.600" fontFamily="body" mb={1}>Nombre completo</Text>
              <HStack spacing={2}>
                <Input size="sm" fontSize="xs" flex={1} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre" />
                <Button size="sm" variant="primary" onClick={handleSaveName} isLoading={saving.name} isDisabled={!fullName.trim()}>
                  Guardar
                </Button>
              </HStack>
            </Box>
            <Box>
              <Text fontSize="xs" fontWeight={600} color="warmGray.600" fontFamily="body" mb={1}>Teléfono</Text>
              <HStack spacing={2}>
                <Input size="sm" fontSize="xs" flex={1} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="999 999 999" />
                <Button size="sm" variant="primary" onClick={handleSavePhone} isLoading={saving.phone}>
                  Guardar
                </Button>
              </HStack>
            </Box>
          </PastelCard>

          <PastelCard title="Mis Direcciones" variant="elevated"
            action={!showAddressForm && !editingAddress && (
              <Button size="sm" variant="primary" onClick={() => setShowAddressForm(true)}>+ Agregar</Button>
            )}
          >
            {showAddressForm && (
              <AddressForm onSave={handleAddAddress} onCancel={() => setShowAddressForm(false)} />
            )}

            {addresses.length === 0 && !showAddressForm && (
              <Text fontFamily="body" fontSize="xs" color="warmGray.500">No tienes direcciones registradas.</Text>
            )}

            {addresses.map((addr) => (
              <Box key={addr.address_id}>
                <Flex justify="space-between" align="flex-start" py={3} borderBottom="1px" borderColor="warmGray.100">
                  {editingAddress?.address_id === addr.address_id ? (
                    <Box flex={1}>
                      <AddressForm initial={addr} onSave={handleUpdateAddress} onCancel={() => setEditingAddress(null)} />
                    </Box>
                  ) : (
                    <>
                      <Box>
                        <Text fontSize="sm" fontFamily="body" color="warmGray.800" fontWeight={500}>{addr.street}</Text>
                        <Text fontSize="xs" fontFamily="body" color="warmGray.500">{addr.city}</Text>
                        {addr.is_default && (
                          <Badge colorScheme="green" variant="subtle" borderRadius="full" size="sm" mt={1}>
                            Por defecto
                          </Badge>
                        )}
                      </Box>
                      <HStack spacing={2} flexShrink={0}>
                        <Button size="xs" variant="ghost" onClick={() => setEditingAddress(addr)}>Editar</Button>
                        <Button size="xs" variant="danger" onClick={() => handleDeleteAddress(addr.address_id)}>Eliminar</Button>
                      </HStack>
                    </>
                  )}
                </Flex>
              </Box>
            ))}
          </PastelCard>

          <PastelCard title="Seguridad" variant="elevated">
            <Box>
              <Text fontSize="xs" fontWeight={600} color="warmGray.600" fontFamily="body" mb={1}>Nueva contraseña</Text>
              <HStack spacing={2}>
                <Input size="sm" fontSize="xs" flex={1} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••" />
                <Button size="sm" variant="primary" onClick={handleUpdatePassword}>Actualizar</Button>
              </HStack>
            </Box>
          </PastelCard>

          {user?.roles?.includes('owner') && (
            <PastelCard title="Dueño de pastelería" variant="elevated">
              <Text fontFamily="body" fontSize="xs" color="warmGray.500" mb={3}>
                Administra tus pastelerías, productos y órdenes desde el panel de dueño.
              </Text>
              <Button variant="primary" onClick={() => navigate('/owner')}>Ir al panel de dueño</Button>
            </PastelCard>
          )}
        </>
      )}
    </Box>
  );
}
