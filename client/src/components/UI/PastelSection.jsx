import { Box, Text } from '@chakra-ui/react'
import PropTypes from 'prop-types'
import { font } from '../../styles/theme'

export default function PastelSection({ title, children, ...rest }) {
  return (
    <Box mb={6} {...rest}>
      {title && (
        <Text fontSize="lg" fontWeight={600} fontFamily={font.heading} mb={3} color="brand.900">
          {title}
        </Text>
      )}
      {children}
    </Box>
  )
}

PastelSection.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node,
}
