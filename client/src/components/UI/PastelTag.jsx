import { Flex, Text } from '@chakra-ui/react'
import PropTypes from 'prop-types'

const palette = {
  brand: { bg: 'brand.100', color: 'brand.700' },
  accent: { bg: 'accent.100', color: 'accent.700' },
  rose: { bg: 'rose.100', color: 'rose.700' },
  warm: { bg: 'orange.100', color: 'orange.700' },
  blue: { bg: 'blue.100', color: 'blue.700' },
  purple: { bg: 'purple.100', color: 'purple.700' },
  teal: { bg: 'teal.100', color: 'teal.700' },
  gray: { bg: 'warmGray.100', color: 'warmGray.600' },
}

function hashColor(str) {
  if (!str) return 'gray'
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  const keys = Object.keys(palette)
  return keys[Math.abs(hash) % keys.length]
}

export default function PastelTag({
  children, color, onRemove, size = 'sm', ...rest
}) {
  const resolvedColor = color || hashColor(typeof children === 'string' ? children : '')
  const colors = palette[resolvedColor] || palette.gray
  const fontSize = size === 'sm' ? '11px' : '13px'
  const px = size === 'sm' ? 2.5 : 3
  const py = size === 'sm' ? 0.5 : 1

  return (
    <Flex
      display="inline-flex"
      align="center"
      gap={1}
      px={px}
      py={py}
      borderRadius="99px"
      bg={colors.bg}
      color={colors.color}
      fontSize={fontSize}
      fontWeight={500}
      fontFamily="body"
      whiteSpace="nowrap"
      transition="all 0.15s"
      {...rest}
    >
      {children}
      {onRemove && (
        <Flex
          as="button"
          ml={0.5}
          w="14px" h="14px"
          borderRadius="50%"
          align="center"
          justify="center"
          fontSize="10px"
          lineHeight="1"
          _hover={{ bg: 'blackAlpha.200' }}
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          aria-label="Eliminar"
        >
          ✕
        </Flex>
      )}
    </Flex>
  )
}

PastelTag.propTypes = {
  children: PropTypes.node,
  color: PropTypes.string,
  onRemove: PropTypes.func,
  size: PropTypes.oneOf(['sm', 'md']),
}
