import { FormControl, FormLabel, FormErrorMessage, Text } from '@chakra-ui/react'
import PropTypes from 'prop-types'
import { font } from '../../styles/theme'

export default function PastelFormField({ label, error, children, required, ...rest }) {
  return (
    <FormControl isInvalid={!!error} isRequired={required} mb={4} {...rest}>
      {label && (
        <FormLabel fontSize="sm" fontWeight={500} fontFamily={font.body} mb={1.5}>
          {label}
        </FormLabel>
      )}
      {children}
      {error && <FormErrorMessage fontSize="xs">{error}</FormErrorMessage>}
    </FormControl>
  )
}

PastelFormField.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  children: PropTypes.node,
  required: PropTypes.bool,
}
