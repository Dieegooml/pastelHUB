import { VStack, Button, Text, Flex, Box } from '@chakra-ui/react'
import { useNavigate, useLocation } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useAuth } from '../../context/AuthContext'
import { useI18n } from '../../context/I18nContext'

export default function Sidebar({ isMobile, onItemClick }) {
  const { user } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()

  const isAdmin = user?.roles?.includes('admin')
  const isOwner = user?.roles?.includes('owner')
  const isModerator = user?.roles?.includes('moderator')

  const nav = (path) => {
    if (onItemClick) onItemClick()
    navigate(path)
  }

  const btnStyle = (path) => ({
    justifyContent: 'flex-start',
    w: 'full',
    variant: 'ghost',
    size: 'sm',
    fontWeight: location.pathname === path ? 600 : 400,
    color: location.pathname === path ? 'brand.900' : 'brand.600',
    bg: location.pathname === path ? 'brand.50' : 'transparent',
    _hover: { bg: 'brand.50' },
  })

  return (
    <VStack align="stretch" gap={1}>
      <Button {...btnStyle('/')} onClick={() => nav('/')}>
        {t('nav.home')}
      </Button>
      <Button {...btnStyle('/cart')} onClick={() => nav('/cart')}>
        {t('nav.cart')}
      </Button>
      <Button {...btnStyle('/my-orders')} onClick={() => nav('/my-orders')}>
        {t('nav.orders')}
      </Button>
      <Button {...btnStyle('/invoices')} onClick={() => nav('/invoices')}>
        {t('nav.invoices')}
      </Button>
      <Button {...btnStyle('/profile')} onClick={() => nav('/profile')}>
        {t('nav.profile')}
      </Button>
      <Button {...btnStyle('/support')} onClick={() => nav('/support')}>
        {t('nav.support')}
      </Button>
      {isOwner && (
        <Button {...btnStyle('/owner')} onClick={() => nav('/owner')}>
          {t('nav.owner')}
        </Button>
      )}
      {isModerator && !isAdmin && (
        <Button {...btnStyle('/moderator')} onClick={() => nav('/moderator')}>
          {t('nav.moderate')}
        </Button>
      )}
      {isAdmin && (
        <Button {...btnStyle('/admin')} onClick={() => nav('/admin')}>
          {t('nav.admin')}
        </Button>
      )}
    </VStack>
  )
}

Sidebar.propTypes = {
  isMobile: PropTypes.bool,
  onItemClick: PropTypes.func,
}
