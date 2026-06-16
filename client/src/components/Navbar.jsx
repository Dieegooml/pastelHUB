import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
  Box, Flex, Text, Button, IconButton, Badge, Menu, MenuButton, MenuList, MenuItem,
  MenuDivider, HStack, Divider,
} from '@chakra-ui/react';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { notificationsService } from '../services/notificationsService';
import { PastelAvatar } from './UI';

const TYPE_ICONS = {
  order_update: '\u{1F6F5}',
  new_review: '\u{2B50}',
  shop_approved: '\u{2705}',
  shop_rejected: '\u{274C}',
  shop_suspended: '\u{1F6AB}',
  report_resolved: '\u{1F4CB}',
  new_order: '\u{1F195}',
  payment_confirmed: '\u{1F4B3}',
  review_approved: '\u{1F44D}',
  review_rejected: '\u{1F44E}',
};

const navItems = [
  { path: '/', label: 'nav.home', roles: null },
  { path: '/cart', label: 'nav.cart', roles: null },
  { path: '/my-orders', label: 'nav.orders', roles: ['customer', 'admin'] },
  { path: '/invoices', label: 'nav.invoices', roles: null },
  { path: '/support', label: 'nav.support', roles: null },
  { path: '/profile', label: 'nav.profile', roles: null },
];

const roleNavItems = [
  { path: '/owner', label: 'nav.owner', roles: ['owner'], color: 'orange.500', activeColor: 'orange.600' },
  { path: '/moderator', label: 'nav.moderate', roles: ['moderator'], color: 'purple.500', activeColor: 'purple.600' },
  { path: '/admin', label: 'nav.admin', roles: ['admin'], color: 'accent.500', activeColor: 'accent.600' },
];

export default function Navbar() {
  const { user } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);
  const notifBtnRef = useRef(null);

  const loadUnread = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await notificationsService.getUnreadCount(user.uid);
      setUnreadCount(res?.count ?? 0);
    } catch (e) { console.error(e); }
  }, [user?.uid]);

  const loadRecent = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await notificationsService.getUnreadByUser(user.uid);
      const list = Array.isArray(res) ? res : res?.data || [];
      setRecentNotifs(list.slice(0, 5));
    } catch (e) { console.error(e); }
  }, [user?.uid]);

  useEffect(() => {
    loadUnread();
    let interval = setInterval(loadUnread, 120000);
    const onVisibility = () => {
      if (document.hidden) clearInterval(interval);
      else { loadUnread(); interval = setInterval(loadUnread, 120000); }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisibility); };
  }, [loadUnread]);

  useEffect(() => {
    if (showNotifDropdown) loadRecent();
  }, [showNotifDropdown, loadRecent]);

  useEffect(() => {
    const handleClick = (e) => {
      if (
        notifRef.current && !notifRef.current.contains(e.target) &&
        notifBtnRef.current && !notifBtnRef.current.contains(e.target)
      ) setShowNotifDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleNotifClick = async (n) => {
    if (!n.isRead) {
      try { await notificationsService.markAsRead(n.id); } catch (e) { console.error(e); }
    }
    setShowNotifDropdown(false);
    loadUnread();
    navigate('/notifications');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <Box
      as="nav"
      bg="white"
      borderBottom="1px solid"
      borderColor="brand.100"
      h="64px"
      px={{ base: 4, md: 8 }}
      position="sticky"
      top={0}
      zIndex={100}
      backdropFilter="blur(12px)"
      bgColor="rgba(255,255,255,0.92)"
    >
      <Flex align="center" justify="space-between" h="full" maxW="1400px" mx="auto">
        {/* Logo */}
        <Flex align="center" gap={3} cursor="pointer" onClick={() => navigate('/')}>
          <Box
            w="32px" h="32px" borderRadius="md" bg="brand.900"
            display="flex" alignItems="center" justifyContent="center"
            fontSize="16px" fontWeight={900} color="white" fontFamily="heading"
          >
            P
          </Box>
          <Text fontFamily="heading" fontSize="xl" fontWeight={700} color="brand.900" display={{ base: 'none', md: 'block' }}>
            PastelHub
          </Text>
        </Flex>

        {/* Nav Items */}
        <HStack spacing={1} display={{ base: 'none', md: 'flex' }}>
          {navItems.map((item) => {
            if (item.roles && !item.roles.some(r => user?.roles?.includes(r))) return null;
            const active = isActive(item.path);
            return (
              <Button
                key={item.path}
                variant={active ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => navigate(item.path)}
                borderRadius="full"
                fontSize="13px"
                fontWeight={500}
              >
                {t(item.label)}
              </Button>
            );
          })}
          {roleNavItems.map((item) => {
            if (!item.roles.some(r => user?.roles?.includes(r))) return null;
            const active = isActive(item.path);
            return (
              <Button
                key={item.path}
                size="sm"
                onClick={() => navigate(item.path)}
                borderRadius="full"
                fontSize="13px"
                fontWeight={500}
                bg={active ? item.activeColor : 'transparent'}
                color={active ? 'white' : 'warmGray.600'}
                border={active ? 'none' : '1px solid'}
                borderColor={active ? 'transparent' : 'brand.200'}
                _hover={active ? {} : { bg: 'brand.50' }}
              >
                {t(item.label)}
              </Button>
            );
          })}
        </HStack>

        {/* Right side */}
        <HStack spacing={2}>
          {/* Language */}
          <Menu>
            <MenuButton
              as={Button}
              size="sm"
              variant="outline"
              borderRadius="full"
              fontSize="12px"
              fontWeight={600}
              minW="44px"
              h="34px"
            >
              {lang === 'es' ? 'ES' : 'EN'}
            </MenuButton>
            <MenuList borderRadius="xl" minW="120px" py={1}>
              <MenuItem
                fontSize="13px"
                onClick={() => setLang('es')}
                bg={lang === 'es' ? 'accent.50' : undefined}
                color={lang === 'es' ? 'accent.700' : undefined}
                fontWeight={lang === 'es' ? 600 : 400}
                borderRadius="md" mx={1}
              >
                {t('nav.spanish')}
              </MenuItem>
              <MenuItem
                fontSize="13px"
                onClick={() => setLang('en')}
                bg={lang === 'en' ? 'accent.50' : undefined}
                color={lang === 'en' ? 'accent.700' : undefined}
                fontWeight={lang === 'en' ? 600 : 400}
                borderRadius="md" mx={1}
              >
                {t('nav.english')}
              </MenuItem>
            </MenuList>
          </Menu>

          {/* Notifications */}
          <Box position="relative" ref={notifBtnRef}>
            <IconButton
              icon={
                <Box position="relative" fontSize="18px" lineHeight="1">
                  {'\u{1F514}'}
                  {unreadCount > 0 && (
                    <Badge
                      position="absolute"
                      top="-6px"
                      right="-8px"
                      bg="rose.500"
                      color="white"
                      borderRadius="full"
                      fontSize="10px"
                      minW="18px"
                      h="18px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      px={1}
                      boxShadow="0 2px 4px rgba(0,0,0,0.15)"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Box>
              }
              variant="outline"
              borderRadius="full"
              borderColor="brand.200"
              size="sm"
              w="36px"
              h="36px"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              aria-label="Notificaciones"
            />

            {showNotifDropdown && (
              <Box
                ref={notifRef}
                position="absolute"
                top="calc(100% + 8px)"
                right={0}
                w="340px"
                bg="white"
                borderRadius="xl"
                boxShadow="0 8px 24px rgba(0,0,0,0.12)"
                border="1px solid"
                borderColor="brand.100"
                overflow="hidden"
                zIndex={1000}
                animation="fadeIn 0.15s ease"
              >
                <Flex p={3} borderBottom="1px solid" borderColor="brand.100" justify="space-between" align="center">
                  <Text fontSize="sm" fontWeight={600} color="brand.800">{t('notifications.title')}</Text>
                  {unreadCount > 0 && (
                    <Text fontSize="xs" color="warmGray.500">{unreadCount} {t('notifications.unread')}</Text>
                  )}
                </Flex>

                {recentNotifs.length === 0 ? (
                  <Box textAlign="center" py={8} px={4}>
                    <Text fontSize="sm" color="warmGray.400">{t('notifications.noNotifications')}</Text>
                  </Box>
                ) : (
                  recentNotifs.map((n) => (
                    <Flex
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      p={3}
                      cursor="pointer"
                      borderBottom="1px solid"
                      borderColor="brand.50"
                      bg={n.isRead ? 'white' : 'accent.50'}
                      _hover={{ bg: 'warmGray.50' }}
                      gap={3}
                      align="flex-start"
                      transition="background 0.15s"
                    >
                      <Text fontSize="md" flexShrink={0}>{TYPE_ICONS[n.type] || '\u{1F514}'}</Text>
                      <Box minW={0}>
                        <Text fontSize="xs" fontWeight={600} color="brand.800" noOfLines={1}>
                          {t(`notifications.types.${n.type}`, n.type)}
                        </Text>
                        <Text fontSize="xs" color="warmGray.500" noOfLines={1}>
                          {n.message}
                        </Text>
                      </Box>
                    </Flex>
                  ))
                )}

                <Flex
                  onClick={() => { setShowNotifDropdown(false); navigate('/notifications'); }}
                  p={3}
                  justify="center"
                  cursor="pointer"
                  borderTop="1px solid"
                  borderColor="brand.100"
                  _hover={{ bg: 'warmGray.50' }}
                  transition="background 0.15s"
                >
                  <Text fontSize="sm" fontWeight={500} color="accent.600">
                    {t('notifications.viewAll')}
                  </Text>
                </Flex>
              </Box>
            )}
          </Box>

          <Divider orientation="vertical" h="24px" borderColor="brand.200" display={{ base: 'none', md: 'block' }} />

          {/* User email + Avatar */}
          <Text fontSize="sm" color="warmGray.500" display={{ base: 'none', lg: 'block' }}>
            {user?.email}
          </Text>

          <Menu>
            <MenuButton
              as={Box}
              cursor="pointer"
              borderRadius="full"
              _hover={{ opacity: 0.8 }}
            >
              <PastelAvatar
                name={user?.full_name || user?.email || ''}
                src={user?.photoURL}
                size="sm"
                showBadge
              />
            </MenuButton>
            <MenuList borderRadius="xl" minW="200px" py={2}>
              <MenuItem
                fontSize="13px"
                onClick={() => navigate('/profile')}
                borderRadius="md" mx={2}
              >
                {t('nav.profile')}
              </MenuItem>
              {user?.roles?.includes('owner') && (
                <MenuItem
                  fontSize="13px"
                  onClick={() => navigate('/owner')}
                  borderRadius="md" mx={2}
                >
                  {t('nav.owner')}
                </MenuItem>
              )}
              {user?.roles?.includes('admin') && (
                <MenuItem
                  fontSize="13px"
                  onClick={() => navigate('/admin')}
                  borderRadius="md" mx={2}
                >
                  {t('nav.admin')}
                </MenuItem>
              )}
              {user?.roles?.includes('moderator') && (
                <MenuItem
                  fontSize="13px"
                  onClick={() => navigate('/moderator')}
                  borderRadius="md" mx={2}
                >
                  {t('nav.moderate')}
                </MenuItem>
              )}
              <MenuDivider />
              <MenuItem
                fontSize="13px"
                color="rose.600"
                onClick={async () => { await signOut(auth); }}
                borderRadius="md" mx={2}
                icon={<Text>🚪</Text>}
              >
                {t('nav.logout')}
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
}
