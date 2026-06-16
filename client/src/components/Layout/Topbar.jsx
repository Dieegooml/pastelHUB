import { useState, useEffect, useRef, useCallback } from 'react'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Flex, HStack, IconButton, Text, Badge, Avatar, Menu, MenuButton, MenuList, MenuItem,
  MenuDivider, Button, useDisclosure, Drawer, DrawerBody, DrawerHeader, DrawerOverlay,
  DrawerContent, DrawerCloseButton, Tooltip,
} from '@chakra-ui/react'
import { signOut } from 'firebase/auth'
import { auth } from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import { useI18n } from '../../context/I18nContext'
import { notificationsService } from '../../services/notificationsService'
import Sidebar from './Sidebar'

const ICONS = {
  home: '🏠', cart: '🛒', orders: '📋', invoices: '📄', support: '💬',
  profile: '👤', notifications: '🔔', owner: '👨‍🍳', admin: '⚙️', moderator: '🛡️',
  logout: '🚪', menu: '☰', close: '✕', language: '🌐',
}

export default function Topbar() {
  const { user, loading } = useAuth()
  const { t, lang, setLang } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [notifCount, setNotifCount] = useState(0)
  const notifRef = useRef()

  const isAdmin = user?.roles?.includes('admin')
  const isOwner = user?.roles?.includes('owner')
  const isModerator = user?.roles?.includes('moderator')

  useEffect(() => {
    const savedLang = localStorage.getItem('lang')
    if (savedLang && savedLang !== lang) setLang(savedLang)
  }, [])

  const handleLang = useCallback(() => {
    const next = lang === 'es' ? 'en' : 'es'
    setLang(next)
    localStorage.setItem('lang', next)
  }, [lang, setLang])

  const handleLogout = useCallback(async () => {
    await signOut(auth)
    navigate('/login')
  }, [navigate])

  useEffect(() => {
    let mounted = true
    if (user) {
      notificationsService.getUnreadCount(user.uid).then((res) => {
        if (mounted) setNotifCount(res?.count ?? res?.data?.count ?? 0)
      }).catch(() => {})
    }
    return () => { mounted = false }
  }, [user])

  if (loading || !user) return null

  const navItems = [
    { label: t('nav.home'), path: '/', icon: ICONS.home },
    { label: t('nav.cart'), path: '/cart', icon: ICONS.cart },
    { label: t('nav.orders'), path: '/my-orders', icon: ICONS.orders },
    { label: t('nav.invoices'), path: '/invoices', icon: ICONS.invoices },
    { label: t('nav.support'), path: '/support', icon: ICONS.support },
  ]

  const roleItems = []
  if (isAdmin) roleItems.push({ label: t('nav.admin'), path: '/admin', icon: ICONS.admin })
  if (isOwner) roleItems.push({ label: t('nav.owner'), path: '/owner', icon: ICONS.owner })
  if (isModerator && !isAdmin) roleItems.push({ label: t('nav.moderator'), path: '/moderator', icon: ICONS.moderator })

  return (
    <>
      <Box
        as="header"
        position="sticky"
        top={0}
        zIndex={100}
        bg="white"
        borderBottom="1px solid"
        borderColor="brand.100"
        px={{ base: 3, md: 6 }}
        py={2.5}
        backdropFilter="blur(8px)"
        bg="rgba(255,255,255,0.92)"
      >
        <Flex align="center" justify="space-between" maxW="1440px" mx="auto">
          <Flex align="center" gap={3}>
            <IconButton
              display={{ base: 'flex', md: 'none' }}
              icon={<Text fontSize="xl">{ICONS.menu}</Text>}
              variant="ghost"
              onClick={onOpen}
              aria-label="Menu"
              size="sm"
            />
            <RouterLink to="/" style={{ textDecoration: 'none' }}>
              <Flex align="center" gap={2}>
                <Text fontSize="xl">🧁</Text>
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

          <HStack display={{ base: 'none', md: 'flex' }} gap={1}>
            {navItems.map(item => (
              <Button
                key={item.path}
                as={RouterLink}
                to={item.path}
                variant={location.pathname === item.path ? 'primary' : 'ghost'}
                size="sm"
                leftIcon={<Text fontSize="md">{item.icon}</Text>}
                fontWeight={location.pathname === item.path ? 600 : 400}
              >
                {item.label}
              </Button>
            ))}
            {roleItems.map(item => (
              <Button
                key={item.path}
                as={RouterLink}
                to={item.path}
                variant={location.pathname.startsWith(item.path) ? 'secondary' : 'ghost'}
                size="sm"
                leftIcon={<Text fontSize="md">{item.icon}</Text>}
              >
                {item.label}
              </Button>
            ))}
          </HStack>

          <HStack gap={1}>
            <Tooltip label={lang === 'es' ? 'English' : 'Español'}>
              <IconButton
                icon={<Text fontSize="md">{ICONS.language}</Text>}
                variant="ghost"
                size="sm"
                onClick={handleLang}
                aria-label="Language"
              />
            </Tooltip>

            <Box position="relative" ref={notifRef}>
              <IconButton
                icon={<Text fontSize="md">{ICONS.notifications}</Text>}
                variant="ghost"
                size="sm"
                onClick={() => { setNotifOpen(!notifOpen); navigate('/notifications') }}
                aria-label="Notifications"
              />
              {notifCount > 0 && (
                <Badge
                  position="absolute"
                  top="-2px"
                  right="-2px"
                  colorScheme="rose"
                  variant="solid"
                  fontSize="10px"
                  minW="18px"
                  h="18px"
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {notifCount > 99 ? '99+' : notifCount}
                </Badge>
              )}
            </Box>

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
                <MenuItem onClick={() => navigate('/profile')} icon={<Text fontSize="md">{ICONS.profile}</Text>}>
                  {t('nav.profile')}
                </MenuItem>
                <MenuItem onClick={() => navigate('/my-orders')} icon={<Text fontSize="md">{ICONS.orders}</Text>}>
                  {t('nav.orders')}
                </MenuItem>
                <MenuDivider />
                <MenuItem onClick={handleLogout} icon={<Text fontSize="md">{ICONS.logout}</Text>} color="rose.500">
                  {t('nav.logout')}
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      </Box>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottom="1px solid" borderColor="brand.100">
            <Flex align="center" gap={2}>
              <Text fontSize="xl">🧁</Text>
              <Text fontFamily="heading" fontSize="lg" fontWeight={700} color="brand.900">PastelHub</Text>
            </Flex>
          </DrawerHeader>
          <DrawerBody p={4}>
            <Sidebar isMobile onItemClick={onClose} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}
