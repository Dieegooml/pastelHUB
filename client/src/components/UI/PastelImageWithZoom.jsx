import { useState, useCallback } from 'react'
import {
  Box, Image, Flex, Text, Modal, ModalOverlay, ModalContent, ModalCloseButton, Spinner,
} from '@chakra-ui/react'
import PropTypes from 'prop-types'

export default function PastelImageWithZoom({
  src, alt, width, height, borderRadius = 'lg', fallback = 'brand', priority = false, ...rest
}) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleLoad = useCallback(() => setLoaded(true), [])
  const handleError = useCallback(() => { setError(true); setLoaded(true) }, [])

  const fallbackColors = {
    brand: 'linear-gradient(135deg, #E8CDB3, #D4A574)',
    gold: 'linear-gradient(135deg, #FDE68A, #F59E0B)',
    rose: 'linear-gradient(135deg, #FECDD3, #FB7185)',
    green: 'linear-gradient(135deg, #A7F3D0, #34D399)',
  }
  const fbGrad = fallbackColors[fallback] || fallbackColors.brand

  if (error) {
    return (
      <Flex
        w={width || 'full'} h={height || 200}
        align="center" justify="center"
        bg={fbGrad}
        borderRadius={borderRadius}
      >
        <Text fontSize="28px" opacity={0.5}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </Text>
      </Flex>
    )
  }

  return (
    <>
      <Box
        position="relative"
        w={width || 'full'} h={height || 'auto'}
        borderRadius={borderRadius}
        overflow="hidden"
        cursor={src ? 'pointer' : 'default'}
        onClick={() => src && setIsOpen(true)}
        role={src ? 'button' : undefined}
        tabIndex={src ? 0 : undefined}
        onKeyDown={(e) => { if (e.key === 'Enter' && src) setIsOpen(true) }}
        transition="transform 0.3s ease, box-shadow 0.3s ease"
        _hover={src ? { transform: 'scale(1.01)', boxShadow: 'lg' } : {}}
        {...rest}
      >
        {!loaded && (
          <Flex
            position="absolute" inset={0}
            align="center" justify="center"
            bg="warmGray.100"
            borderRadius={borderRadius}
          >
            <Spinner size="sm" color="brand.400" />
          </Flex>
        )}
        <Image
          src={src}
          alt={alt}
          w="full" h="full"
          objectFit="cover"
          opacity={loaded ? 1 : 0}
          transition="opacity 0.4s ease"
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          fallback={<Box />}
        />
      </Box>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="5xl" isCentered>
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="transparent" boxShadow="none" maxW="90vw" maxH="90vh">
          <ModalCloseButton color="white" zIndex={2} />
          <Image
            src={src}
            alt={alt}
            w="full" maxH="85vh"
            objectFit="contain"
            borderRadius="lg"
          />
        </ModalContent>
      </Modal>
    </>
  )
}

PastelImageWithZoom.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  borderRadius: PropTypes.string,
  fallback: PropTypes.string,
  priority: PropTypes.bool,
}
