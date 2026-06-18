import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
  Box, Flex, Text, Button, IconButton, Badge, Menu, MenuButton, MenuList, MenuItem,
  MenuDivider, HStack, Divider, useDisclosure, Drawer, DrawerBody, DrawerHeader,
  DrawerOverlay, DrawerContent, DrawerCloseButton, Tooltip,
} from '@chakra-ui/react';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { notificationsService } from '../services/notificationsService';
import { PastelAvatar } from './UI';
import websocketService from '../services/websocketService';

const icons = {
  home: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  cart: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  orders: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  invoices: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  support: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  profile: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  globe: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  logout: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  owner: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/></svg>,
  admin: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  moderator: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  close: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

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
  { path: '/', label: 'nav.home', icon: 'home' },
  { path: '/cart', label: 'nav.cart', icon: 'cart' },
  { path: '/my-orders', label: 'nav.orders', icon: 'orders', roles: ['customer', 'admin'] },
  { path: '/invoices', label: 'nav.invoices', icon: 'invoices' },
  { path: '/support', label: 'nav.support', icon: 'support' },
  { path: '/profile', label: 'nav.profile', icon: 'profile' },
];

const roleNavItems = [
  { path: '/owner', label: 'nav.owner', icon: 'owner', roles: ['owner'], color: 'orange.500', activeColor: 'orange.600' },
  { path: '/moderator', label: 'nav.moderate', icon: 'moderator', roles: ['moderator'], color: 'purple.500', activeColor: 'purple.600' },
  { path: '/admin', label: 'nav.admin', icon: 'admin', roles: ['admin'], color: 'accent.500', activeColor: 'accent.600' },
];

export default function Navbar({ variant = 'auth' }) {
  const { user, loading } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);
  const notifBtnRef = useRef(null);

  const isPublic = variant === 'public';
  const isAuth = variant === 'auth';

  const loadUnread = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await notificationsService.getUnreadCount(user.uid);
      setUnreadCount(res?.count ?? res?.data?.count ?? 0);
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
    if (!user) return;
    loadUnread();
    const interval = setInterval(loadUnread, 120000);
    const onVisibility = () => {
      if (document.hidden) clearInterval(interval);
      else { loadUnread(); }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const unsub = websocketService.onNotification(() => {
      loadUnread();
    });

    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisibility); unsub?.(); };
  }, [user, loadUnread]);

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

  const NavButton = ({ item, active, ...props }) => (
    <Button
      variant={active ? 'primary' : 'ghost'}
      size="sm"
      onClick={() => navigate(item.path)}
      borderRadius="full"
      fontSize="13px"
      fontWeight={active ? 600 : 400}
      leftIcon={icons[item.icon]}
      {...props}
    >
      {t(item.label)}
    </Button>
  );

  const RoleButton = ({ item, active }) => (
    <Button
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
      leftIcon={icons[item.icon]}
    >
      {t(item.label)}
    </Button>
  );

  const drawerNavItems = [
    { path: '/', label: 'nav.home' },
    { path: '/cart', label: 'nav.cart' },
    { path: '/my-orders', label: 'nav.orders' },
    { path: '/invoices', label: 'nav.invoices' },
    { path: '/profile', label: 'nav.profile' },
    { path: '/support', label: 'nav.support' },
  ];

  const drawerRoleItems = [
    { path: '/owner', label: 'nav.owner', roles: ['owner'] },
    { path: '/moderator', label: 'nav.moderate', roles: ['moderator'] },
    { path: '/admin', label: 'nav.admin', roles: ['admin'] },
  ];

  return (
    <>
      <Box
        as="nav"
        bg="white"
        borderBottom="1px solid"
        borderColor="brand.100"
        h={isPublic ? '57px' : '64px'}
        px={{ base: 3, md: 6 }}
        position="sticky"
        top={0}
        zIndex={100}
        backdropFilter="blur(12px)"
        bgColor="rgba(255,255,255,0.92)"
      >
        <Flex align="center" justify="space-between" h="full" maxW="1440px" mx="auto">
          {/* Left: Logo + hamburger */}
          <Flex align="center" gap={3}>
            {(isAuth || user) && (
              <IconButton
                display={{ base: 'flex', md: 'none' }}
                variant="ghost"
                size="sm"
                onClick={onOpen}
                aria-label="Menu"
                icon={icons.menu}
              />
            )}
            <Flex
              align="center" gap={2}
              cursor="pointer"
              onClick={() => navigate('/')}
              _hover={{ opacity: 0.85 }}
              transition="opacity 0.2s"
            >
              <Box
                w="28px" h="28px" borderRadius="md" bg="brand.900"
                display="flex" alignItems="center" justifyContent="center"
                fontSize="14px" fontWeight={800} color="white" fontFamily="heading"
              >
                P
              </Box>
              <Text
                fontFamily="heading" fontSize="xl" fontWeight={700}
                color="brand.900" letterSpacing="-0.5px"
                display={{ base: 'none', sm: 'block' }}
              >
                PastelHub
              </Text>
            </Flex>
          </Flex>

          {/* Center nav items — desktop */}
          <HStack display={{ base: 'none', md: 'flex' }} spacing={1}>
            {isPublic && !user && (
              <NavButton item={{ path: '/', label: 'nav.home', icon: 'home' }} active={isActive('/')} />
            )}
            {isAuth && navItems.map((item) => {
              if (item.roles && !item.roles.some(r => user?.roles?.includes(r))) return null;
              return <NavButton key={item.path} item={item} active={isActive(item.path)} />;
            })}
            {isAuth && roleNavItems.map((item) => {
              if (!item.roles.some(r => user?.roles?.includes(r))) return null;
              return <RoleButton key={item.path} item={item} active={isActive(item.path)} />;
            })}
            {isPublic && user && (
              <>
                <NavButton item={{ path: '/', label: 'nav.home', icon: 'home' }} active={isActive('/')} />
                <NavButton item={{ path: '/cart', label: 'nav.cart', icon: 'cart' }} active={isActive('/cart')} />
                <NavButton item={{ path: '/my-orders', label: 'nav.orders', icon: 'orders' }} active={isActive('/my-orders')} />
                {user?.roles?.includes('owner') && <RoleButton item={roleNavItems[0]} active={isActive('/owner')} />}
                {user?.roles?.includes('admin') && <RoleButton item={roleNavItems[2]} active={isActive('/admin')} />}
                {user?.roles?.includes('moderator') && !user?.roles?.includes('admin') && <RoleButton item={roleNavItems[1]} active={isActive('/moderator')} />}
              </>
            )}
          </HStack>

          {/* Right side */}
          <HStack spacing={1}>
            {/* Language */}
            <Menu>
              <MenuButton
                as={IconButton}
                size="sm"
                variant="outline"
                borderRadius="full"
                borderColor="brand.200"
                w="36px" h="36px"
                icon={icons.globe}
                aria-label={t('nav.language')}
              />
              <MenuList borderRadius="xl" minW="140px" py={1}>
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

            {/* Notifications — authenticated only */}
            {user && (
              <>
                <Box position="relative" ref={notifBtnRef}>
                  <IconButton
                    icon={
                      <Box position="relative" fontSize="18px" lineHeight="1">
                        {icons.bell}
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
                    aria-label={t('notifications.title')}
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
                      role="dialog"
                      aria-label={t('notifications.title')}
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
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleNotifClick(n); }}
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
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') { setShowNotifDropdown(false); navigate('/notifications'); }}}
                      >
                        <Text fontSize="sm" fontWeight={500} color="accent.600">
                          {t('notifications.viewAll')}
                        </Text>
                      </Flex>
                    </Box>
                  )}
                </Box>

                <Divider orientation="vertical" h="24px" borderColor="brand.200" display={{ base: 'none', md: 'block' }} />
              </>
            )}

            {/* User section */}
            {user ? (
              <>
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
                      icon={icons.profile}
                    >
                      {t('nav.profile')}
                    </MenuItem>
                    {user?.roles?.includes('owner') && (
                      <MenuItem
                        fontSize="13px"
                        onClick={() => navigate('/owner')}
                        borderRadius="md" mx={2}
                        icon={icons.owner}
                      >
                        {t('nav.owner')}
                      </MenuItem>
                    )}
                    {user?.roles?.includes('admin') && (
                      <MenuItem
                        fontSize="13px"
                        onClick={() => navigate('/admin')}
                        borderRadius="md" mx={2}
                        icon={icons.admin}
                      >
                        {t('nav.admin')}
                      </MenuItem>
                    )}
                    {user?.roles?.includes('moderator') && !user?.roles?.includes('admin') && (
                      <MenuItem
                        fontSize="13px"
                        onClick={() => navigate('/moderator')}
                        borderRadius="md" mx={2}
                        icon={icons.moderator}
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
                      icon={icons.logout}
                    >
                      {t('nav.logout')}
                    </MenuItem>
                  </MenuList>
                </Menu>
              </>
            ) : !loading && (
              <HStack gap={1}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                  fontWeight={500}
                  fontSize="13px"
                >
                  {t('auth.login')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/register')}
                  fontWeight={500}
                  fontSize="13px"
                  display={{ base: 'none', md: 'inline-flex' }}
                >
                  {t('auth.register')}
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
              {drawerNavItems.map((item) => (
                <Button
                  key={item.path}
                  justifyContent="flex-start"
                  w="full"
                  variant="ghost"
                  size="sm"
                  fontWeight={location.pathname === item.path ? 600 : 400}
                  color={location.pathname === item.path ? 'brand.900' : 'brand.600'}
                  bg={location.pathname === item.path ? 'brand.50' : 'transparent'}
                  _hover={{ bg: 'brand.50' }}
                  leftIcon={icons[item.icon]}
                  onClick={() => { onClose(); navigate(item.path); }}
                  mb={1}
                >
                  {t(item.label)}
                </Button>
              ))}
              <Box borderTop="1px solid" borderColor="brand.100" my={2} pt={2}>
                {drawerRoleItems.map((item) => {
                  if (!item.roles.some(r => user?.roles?.includes(r))) return null;
                  return (
                    <Button
                      key={item.path}
                      justifyContent="flex-start"
                      w="full"
                      variant="ghost"
                      size="sm"
                      fontWeight={location.pathname.startsWith(item.path) ? 600 : 400}
                      color={location.pathname.startsWith(item.path) ? 'brand.900' : 'brand.600'}
                      bg={location.pathname.startsWith(item.path) ? 'brand.50' : 'transparent'}
                      _hover={{ bg: 'brand.50' }}
                      leftIcon={icons[item.icon === 'moderator' ? 'moderator' : item.icon]}
                      onClick={() => { onClose(); navigate(item.path); }}
                      mb={1}
                    >
                      {t(item.label)}
                    </Button>
                  );
                })}
              </Box>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
