import { Badge } from '@chakra-ui/react'
import PropTypes from 'prop-types'

const STATUS_STYLES = {
  active: { bg: 'green.100', color: 'green.700' },
  approved: { bg: 'green.100', color: 'green.700' },
  pending: { bg: 'yellow.100', color: 'yellow.800' },
  rejected: { bg: 'red.100', color: 'red.700' },
  inactive: { bg: 'gray.100', color: 'gray.600' },
  suspended: { bg: 'red.100', color: 'red.700' },
}

export default function PastelStatusBadge({ status }) {
  const style = STATUS_STYLES[status] || { bg: 'gray.100', color: 'gray.600' }
  return (
    <Badge
      bg={style.bg}
      color={style.color}
      px={3}
      py={0.5}
      borderRadius="full"
      fontSize="11px"
      fontWeight={500}
      textTransform="capitalize"
    >
      {status}
    </Badge>
  )
}

PastelStatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
}
