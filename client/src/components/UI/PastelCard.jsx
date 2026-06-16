import { Box, Flex, Text } from '@chakra-ui/react'
import PropTypes from 'prop-types'
import { font, colors } from '../../styles/theme'

export default function PastelCard({ variant, title, children, ...rest }) {
  const isElevated = variant === 'elevated'

  return (
    <Box
      bg="white"
      borderRadius="12px"
      borderWidth={isElevated ? '1px' : '0'}
      borderColor="brand.100"
      boxShadow={isElevated ? '0 2px 10px rgba(0,0,0,0.06)' : 'none'}
      overflow="hidden"
      fontFamily={font.body}
      {...rest}
    >
      {title && (
        <Flex
          px={5}
          py={3}
          borderBottom="1px solid"
          borderColor="brand.100"
          bg="brand.50"
        >
          <Text fontSize="sm" fontWeight={600} color="brand.900">{title}</Text>
        </Flex>
      )}
      {children}
    </Box>
  )
}

PastelCard.propTypes = {
  variant: PropTypes.string,
  title: PropTypes.string,
  children: PropTypes.node,
}
