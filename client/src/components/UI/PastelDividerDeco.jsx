import { Box } from '@chakra-ui/react'
import PropTypes from 'prop-types'

export default function PastelDividerDeco({ variant = 'dots', spacing = '32px' }) {
  if (variant === 'dots') {
    return (
      <Box textAlign="center" py={spacing} opacity={0.3}>
        <Box as="span" display="inline-flex" gap={2} align="center">
          {[1, 2, 3].map((i) => (
            <Box
              key={i}
              w="6px" h="6px" borderRadius="50%"
              bg="brand.400"
              display="inline-block"
            />
          ))}
        </Box>
      </Box>
    )
  }

  if (variant === 'line') {
    return (
      <Box py={spacing} position="relative">
        <Box h="1px" bg="warmGray.200" />
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          w="40px" h="3px"
          borderRadius="2px"
          bg="accent.400"
        />
      </Box>
    )
  }

  if (variant === 'wave') {
    return (
      <Box py={spacing} textAlign="center" color="brand.200" fontSize="24px" lineHeight="1">
        <svg width="80" height="12" viewBox="0 0 80 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 6 Q10 0 20 6 Q30 12 40 6 Q50 0 60 6 Q70 12 80 6" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </Box>
    )
  }

  return null
}

PastelDividerDeco.propTypes = {
  variant: PropTypes.oneOf(['dots', 'line', 'wave']),
  spacing: PropTypes.string,
}
