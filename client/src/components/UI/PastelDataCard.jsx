import { Box, Text } from '@chakra-ui/react'
import PropTypes from 'prop-types'
import { font } from '../../styles/theme'

export default function PastelDataCard({ label, value, ...rest }) {
  return (
    <Box
      bg="white"
      p={4}
      borderRadius="10px"
      border="1px solid"
      borderColor="brand.100"
      {...rest}
    >
      <Text fontSize="xs" color="brand.500" mb={1} fontFamily={font.body}>{label}</Text>
      <Text fontSize="sm" fontWeight={500} color="brand.900" fontFamily={font.body}>{value}</Text>
    </Box>
  )
}

PastelDataCard.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
}
