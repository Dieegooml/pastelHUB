import { useRef, useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  Box, Flex, HStack, IconButton, Text, Avatar, Menu, MenuButton, MenuList, MenuItem,
  MenuDivider, Button, useDisclosure, Drawer, DrawerBody, DrawerHeader, DrawerOverlay,
  DrawerContent, DrawerCloseButton, Tooltip,
} from '@chakra-ui/react'
import { signOut } from 'firebase/auth'
import { auth } from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import { useI18n } from '../../context/I18nContext'
import { notificationsService } from '../../services/notificationsService'
import Sidebar from './Sidebar'

export default function PublicTopbar() {
  const { user, loading } = useAuth()
  const { lang, setLang } = useI18n()
  const navigate = useNavigate()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [notifCount, setNotifCount] = useState(0)

  const isAdmin = user?.roles?.includes('admin')
  const isOwner = user?.roles?.includes('owner')
  const isModerator = user?.roles?.includes('moderator')

  useEffect(() => {
    const savedLang = localStorage.getItem('lang')
    if (savedLang && savedLang !== lang) setLang(savedLang)
  }, [])

  const handleLang = () => {
    const next = lang === 'es' ? 'en' : 'es'
    setLang(next)
    localStorage.setItem('lang', next)
  }

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  useEffect(() => {
    let mounted = true
    if (user) {
      notificationsService.getUnreadCount(user.uid).then((res) => {
        if (mounted) setNotifCount(res?.count ?? res?.data?.count ?? 0)
      }).catch(() => {})
    }
    return () => { mounted = false }
  }, [user])

  const langLabel = lang === 'es' ? 'English' : 'Español'

  return (
    <>
      <Box
        as="header"
        position="sticky"
        top={0}
        zIndex={100}
        bg="rgba(255,255,255,0.92)"
        borderBottom="1px solid"
        borderColor="brand.100"
        px={{ base: 3, md: 6 }}
        py={2.5}
        backdropFilter="blur(8px)"
      >
        <Flex align="center" justify="space-between" maxW="1440px" mx="auto">
          {/* Left: Logo + nav */}
          <Flex align="center" gap={3}>
            {user && (
              <IconButton
                display={{ base: 'flex', md: 'none' }}
                variant="ghost"
                size="sm"
                onClick={onOpen}
                aria-label="Menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </IconButton>
            )}
            <RouterLink to="/" style={{ textDecoration: 'none' }}>
              <Flex align="center" gap={2}>
                <Box w="28px" h="28px" borderRadius="8px" bg="brand.900" color="white" display="flex" alignItems="center" justifyContent="center" fontSize="14px" fontWeight={800} fontFamily="heading">
                  P
                </Box>
                <Text
                  fontFamily="heading"
                  fontSize="xl"
                  fontWeight={700}
                  color="brand.900"
                  letterSpacing="-0.5px"
                  display={{ base: 'none', sm: 'block' }}
                >
                  PastelHub
                </Text>
              </Flex>
            </RouterLink>
          </Flex>

          {/* Center nav — desktop */}
          <HStack display={{ base: 'none', md: 'flex' }} gap={1}>
            <Button
              as={RouterLink}
              to="/"
              variant="ghost"
              size="sm"
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              }
              fontWeight={400}
            >
              Inicio
            </Button>
            {user && (
              <>
                <Button
                  as={RouterLink}
                  to="/cart"
                  variant="ghost"
                  size="sm"
                  leftIcon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                  }
                  fontWeight={400}
                >
                  Carrito
                </Button>
                <Button
                  as={RouterLink}
                  to="/my-orders"
                  variant="ghost"
                  size="sm"
                  leftIcon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                  }
                  fontWeight={400}
                >
                  Órdenes
                </Button>
                {isOwner && (
                  <Button
                    as={RouterLink}
                    to="/owner"
                    variant="ghost"
                    size="sm"
                    leftIcon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                      </svg>
                    }
                    fontWeight={400}
                  >
                    Tienda
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    as={RouterLink}
                    to="/admin"
                    variant="ghost"
                    size="sm"
                    leftIcon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                    }
                    fontWeight={400}
                  >
                    Admin
                  </Button>
                )}
                {isModerator && !isAdmin && (
                  <Button
                    as={RouterLink}
                    to="/moderator"
                    variant="ghost"
                    size="sm"
                    leftIcon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                    }
                    fontWeight={400}
                  >
                    Moderar
                  </Button>
                )}
              </>
            )}
          </HStack>

          {/* Right: lang + auth */}
          <HStack gap={1}>
            <Tooltip label={langLabel}>
              <IconButton
                variant="ghost"
                size="sm"
                onClick={handleLang}
                aria-label={langLabel}
              >
                <Box w="18px" h="18px" color="warmGray.500">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </Box>
              </IconButton>
            </Tooltip>

            {user ? (
              <Menu>
                <MenuButton
                  as={Button}
                  variant="ghost"
                  size="sm"
                  leftIcon={
                    <Avatar
                      size="xs"
                      name={user.displayName || user.email}
                      src={user.photoURL}
                      bg="brand.200"
                      color="brand.800"
                    />
                  }
                  px={2}
                  _hover={{ bg: 'brand.50' }}
                >
                  <Text
                    maxW="120px"
                    isTruncated
                    fontSize="sm"
                    color="brand.800"
                    display={{ base: 'none', md: 'block' }}
                  >
                    {user.displayName || user.email}
                  </Text>
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => navigate('/profile')}>
                    <Flex align="center" gap={2}>
                      <Box w="16px" h="16px">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                      </Box>
                      <Text>Perfil</Text>
                    </Flex>
                  </MenuItem>
                  <MenuItem onClick={() => navigate('/my-orders')}>
                    <Flex align="center" gap={2}>
                      <Box w="16px" h="16px">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                        </svg>
                      </Box>
                      <Text>Órdenes</Text>
                    </Flex>
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem onClick={handleLogout} color="rose.500">
                    <Flex align="center" gap={2}>
                      <Box w="16px" h="16px">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                      </Box>
                      <Text>Cerrar sesión</Text>
                    </Flex>
                  </MenuItem>
                </MenuList>
              </Menu>
            ) : !loading && (
              <HStack gap={1}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                  fontWeight={500}
                >
                  Iniciar sesión
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/register')}
                  fontWeight={500}
                  display={{ base: 'none', md: 'inline-flex' }}
                >
                  Registrarse
                </Button>
              </HStack>
            )}
          </HStack>
        </Flex>
      </Box>

      {/* Mobile drawer */}
      {user && (
        <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader borderBottom="1px solid" borderColor="brand.100">
              <Flex align="center" gap={2}>
                <Box w="24px" h="24px" borderRadius="6px" bg="brand.900" color="white" display="flex" alignItems="center" justifyContent="center" fontSize="12px" fontWeight={800} fontFamily="heading">
                  P
                </Box>
                <Text fontFamily="heading" fontSize="lg" fontWeight={700} color="brand.900">PastelHub</Text>
              </Flex>
            </DrawerHeader>
            <DrawerBody p={4}>
              <Sidebar isMobile onItemClick={onClose} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      )}
    </>
  )
}
