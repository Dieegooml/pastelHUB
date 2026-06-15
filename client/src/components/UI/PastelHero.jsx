import { Box, Flex, Heading, Text } from '@chakra-ui/react'
import PropTypes from 'prop-types'

const gradients = {
  dark: 'linear-gradient(135deg, #2D1810 0%, #4A2F1A 50%, #2D1810 100%)',
  warm: 'linear-gradient(135deg, #FDF6EE 0%, #F5E6D3 50%, #E8CDB3 100%)',
  accent: 'linear-gradient(135deg, #14532D 0%, #22C55E 100%)',
  brand: 'linear-gradient(135deg, #2D1810 0%, #6B4226 100%)',
  sunset: 'linear-gradient(135deg, #4A2F1A 0%, #C48B5A 50%, #6B4226 100%)',
}

const dotPattern = `
  <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <circle cx="2" cy="2" r="1.5" fill="currentColor" opacity="0.15"/>
  </svg>
`

function DecorativeCircle({ size, top, right, bottom, left, opacity = 0.05 }) {
  return (
    <Box
      position="absolute"
      w={size}
      h={size}
      borderRadius="50%"
      bg="white"
      opacity={opacity}
      top={top}
      right={right}
      bottom={bottom}
      left={left}
    />
  )
}

DecorativeCircle.propTypes = {
  size: PropTypes.string,
  top: PropTypes.string,
  right: PropTypes.string,
  bottom: PropTypes.string,
  left: PropTypes.string,
  opacity: PropTypes.number,
}

export default function PastelHero({
  children, title, subtitle, gradient = 'dark', size = 'md', pattern = true,
}) {
  const sizeMap = {
    sm: { py: { base: 8, md: 12 }, titleSize: { base: '28px', md: '36px' } },
    md: { py: { base: 12, md: 16 }, titleSize: { base: '32px', md: '48px' } },
    lg: { py: { base: 16, md: 24 }, titleSize: { base: '36px', md: '56px' } },
  }
  const s = sizeMap[size] || sizeMap.md

  return (
    <Box
      position="relative"
      bg={gradients[gradient] || gradients.dark}
      px={{ base: 4, md: 8 }}
      py={s.py}
      overflow="hidden"
    >
      {pattern && (
        <Box
          position="absolute"
          inset={0}
          opacity={0.4}
          backgroundImage={`url("data:image/svg+xml,${encodeURIComponent(dotPattern)}")`}
          backgroundSize="20px 20px"
        />
      )}
      <DecorativeCircle size="400px" top="-120px" right="-80px" opacity={0.04} />
      <DecorativeCircle size="250px" bottom="-60px" left="5%" opacity={0.03} />
      <DecorativeCircle size="150px" top="20%" right="30%" opacity={0.06} />
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="1px"
        bg="linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)"
      />

      <Box maxW="1100px" mx="auto" position="relative" zIndex={1}>
        {title && (
          <Heading
            as="h1"
            fontFamily="heading"
            fontSize={s.titleSize}
            fontWeight={700}
            color={gradient === 'warm' ? 'brand.900' : 'white'}
            mb={3}
            lineHeight={1.15}
            letterSpacing="-0.02em"
          >
            {title}
          </Heading>
        )}
        {subtitle && (
          <Text
            fontFamily="body"
            fontSize={{ base: '14px', md: '16px' }}
            color={gradient === 'warm' ? 'brand.600' : 'whiteAlpha.700'}
            maxW="560px"
            lineHeight={1.7}
            mb={6}
          >
            {subtitle}
          </Text>
        )}
        {children}
      </Box>
    </Box>
  )
}

PastelHero.propTypes = {
  children: PropTypes.node,
  title: PropTypes.node,
  subtitle: PropTypes.string,
  gradient: PropTypes.oneOf(['dark', 'warm', 'accent', 'brand', 'sunset']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  pattern: PropTypes.bool,
}
