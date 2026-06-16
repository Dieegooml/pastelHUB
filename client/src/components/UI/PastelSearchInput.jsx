import { Box, Text } from '@chakra-ui/react'
import PropTypes from 'prop-types'
import { font } from '../../styles/theme'

export default function PastelSearchInput({ value, onChange, placeholder, ...rest }) {
  return (
    <Box
      as="input"
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || 'Buscar...'}
      px={4}
      py={2.5}
      borderRadius="full"
      border="1px solid"
      borderColor="brand.200"
      bg="white"
      fontSize="14px"
      fontFamily={font.body}
      outline="none"
      _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 2px brand.100' }}
      w="full"
      maxW="320px"
      {...rest}
    />
  )
}

PastelSearchInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
}
