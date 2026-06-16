import { Box, Text } from '@chakra-ui/react'
import PropTypes from 'prop-types'
import { font, colors } from '../../styles/theme'

export default function PastelStatCard({ label, value, icon, ...rest }) {
  return (
    <Box
      bg="white"
      p={4}
      borderRadius="12px"
      border="1px solid"
      borderColor="brand.100"
      boxShadow="0 1px 4px rgba(0,0,0,0.04)"
      fontFamily={font.body}
      {...rest}
    >
      <Text fontSize="xs" color="brand.500" mb={1}>{label}</Text>
      <Text fontSize="2xl" fontWeight={700} color="brand.900">{value}</Text>
      {icon && <Box mt={2}>{icon}</Box>}
    </Box>
  )
}

PastelStatCard.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  icon: PropTypes.node,
}
