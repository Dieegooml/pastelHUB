import { Flex, Button } from '@chakra-ui/react'
import PropTypes from 'prop-types'

export default function PastelFilterBar({ options, active, onChange }) {
  return (
    <Flex gap={2} wrap="wrap" mb={4}>
      {options.map((opt) => (
        <Button
          key={opt.value}
          size="sm"
          variant={active === opt.value ? 'solid' : 'outline'}
          colorScheme={active === opt.value ? 'brand' : 'gray'}
          borderRadius="full"
          px={4}
          fontWeight={500}
          fontSize="13px"
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </Flex>
  )
}

PastelFilterBar.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  })).isRequired,
  active: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
}
