import { Text, Flex } from '@chakra-ui/react'
import PropTypes from 'prop-types'

export default function PastelPrice({
  value, currency = 'S/', size = 'md', color, fontWeight = 700, oldPrice, ...rest
}) {
  const sizeMap = {
    xs: { fontSize: '13px' },
    sm: { fontSize: '16px' },
    md: { fontSize: '22px' },
    lg: { fontSize: '28px' },
    xl: { fontSize: '36px' },
  }
  const dims = sizeMap[size] || sizeMap.md

  if (oldPrice) {
    return (
      <Flex align="baseline" gap={2} {...rest}>
        <Text fontSize={dims.fontSize} fontWeight={fontWeight} color={color || 'accent.500'} fontFamily="body">
          {currency} {value.toFixed(2)}
        </Text>
        <Text fontSize="sm" color="warmGray.400" textDecoration="line-through" fontWeight={400}>
          {currency} {oldPrice.toFixed(2)}
        </Text>
      </Flex>
    )
  }

  return (
    <Text fontSize={dims.fontSize} fontWeight={fontWeight} color={color || 'accent.500'} fontFamily="body" {...rest}>
      {currency} {value.toFixed(2)}
    </Text>
  )
}

PastelPrice.propTypes = {
  value: PropTypes.number.isRequired,
  currency: PropTypes.string,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  color: PropTypes.string,
  fontWeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  oldPrice: PropTypes.number,
}
