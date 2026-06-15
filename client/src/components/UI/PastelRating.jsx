import { Box, Flex, Text } from '@chakra-ui/react'
import PropTypes from 'prop-types'

const STAR_FULL = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const STAR_HALF = (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <defs>
      <linearGradient id="halfGrad">
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="50%" stopColor="#E5E7EB" />
      </linearGradient>
    </defs>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
      fill="url(#halfGrad)" stroke="#F59E0B" strokeWidth="1" />
  </svg>
)

const STAR_EMPTY = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E5E7EB" strokeWidth="1.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

export default function PastelRating({ value = 0, count, size = 'md', showValue = true }) {
  const starSize = size === 'sm' ? '14px' : size === 'lg' ? '20px' : '16px'
  const textSize = size === 'sm' ? 'xs' : size === 'lg' ? 'sm' : '13px'

  const fullStars = Math.floor(value)
  const hasHalf = value - fullStars >= 0.3 && value - fullStars < 0.7
  const adjustedFull = value - fullStars >= 0.7 ? fullStars + 1 : fullStars

  return (
    <Flex align="center" gap={1}>
      <Flex align="center" gap={0.5}>
        {[1, 2, 3, 4, 5].map((star) => {
          let icon
          if (star <= adjustedFull) {
            icon = STAR_FULL
          } else if (star === adjustedFull + 1 && hasHalf) {
            icon = STAR_HALF
          } else {
            icon = STAR_EMPTY
          }
          return (
            <Box key={star} w={starSize} h={starSize} lineHeight="1">
              {icon}
            </Box>
          )
        })}
      </Flex>
      {showValue && (
        <Text fontSize={textSize} fontWeight={600} color="brand.800" ml={1}>
          {value.toFixed(1)}
        </Text>
      )}
      {count !== undefined && (
        <Text fontSize={textSize} color="warmGray.400" ml={0.5}>
          ({count})
        </Text>
      )}
    </Flex>
  )
}

PastelRating.propTypes = {
  value: PropTypes.number,
  count: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showValue: PropTypes.bool,
}
