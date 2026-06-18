import { useState, useCallback } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import PropTypes from 'prop-types'

const FALLBACK_GRADIENTS = {
  brand: 'linear-gradient(135deg, #E8CDB3, #D4A574)',
  gold: 'linear-gradient(135deg, #FDE68A, #F59E0B)',
  rose: 'linear-gradient(135deg, #FECDD3, #FB7185)',
  green: 'linear-gradient(135deg, #A7F3D0, #34D399)',
  blue: 'linear-gradient(135deg, #BFDBFE, #60A5FA)',
  warm: 'linear-gradient(135deg, #FED7AA, #FB923C)',
}

const FALLBACK_ICONS = {
  shop: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  product: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  image: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  avatar: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
}

export default function PastelImageWithFallback({
  src, alt = '', type = 'image',
  width, height, w, h,
  borderRadius = 'lg', objectFit = 'cover',
  priority = false, asBox = false,
  ...rest
}) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const handleError = useCallback(() => setError(true), [])
  const handleLoad = useCallback(() => setLoaded(true), [])

  const resW = w || width || 'full'
  const resH = h || height || 200
  const grad = FALLBACK_GRADIENTS[type] || FALLBACK_GRADIENTS.brand
  const icon = FALLBACK_ICONS[type] || FALLBACK_ICONS.image

  if (error || !src) {
    return (
      <Flex
        w={resW} h={resH}
        align="center" justify="center"
        bg={grad}
        borderRadius={borderRadius}
        {...rest}
      >
        {icon}
      </Flex>
    )
  }

  const imgProps = {
    src,
    alt,
    style: {
      width: '100%',
      height: '100%',
      objectFit,
      borderRadius,
      opacity: loaded ? 1 : 0,
      transition: 'opacity 0.3s ease',
    },
    onLoad: handleLoad,
    onError: handleError,
    loading: priority ? 'eager' : 'lazy',
  }

  if (asBox) {
    return (
      <Box
        as="img"
        w={resW} h={resH}
        borderRadius={borderRadius}
        {...imgProps}
        {...rest}
      />
    )
  }

  return (
    <Box w={resW} h={resH} borderRadius={borderRadius} overflow="hidden" position="relative" {...rest}>
      {!loaded && (
        <Flex
          position="absolute" inset={0}
          align="center" justify="center"
          bg="warmGray.100"
          borderRadius={borderRadius}
          zIndex={0}
        />
      )}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <img {...imgProps} />
    </Box>
  )
}

PastelImageWithFallback.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  type: PropTypes.oneOf(['shop', 'product', 'image', 'avatar', 'brand', 'gold', 'rose', 'green', 'blue', 'warm']),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  w: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  h: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  borderRadius: PropTypes.string,
  objectFit: PropTypes.string,
  priority: PropTypes.bool,
  asBox: PropTypes.bool,
}
