import { Box, Flex, Heading, Text, Button } from '@chakra-ui/react'
import PropTypes from 'prop-types'

const defaultIcon = (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

export default function PastelErrorState({
  icon = defaultIcon, title = 'Algo salio mal', message, onRetry, onBack, backLabel = 'Volver',
}) {
  return (
    <Flex direction="column" align="center" justify="center" py={16} px={4}>
      {typeof icon === 'string' ? (
        <Box fontSize="4xl" mb={4}>{icon}</Box>
      ) : (
        <Box mb={4} color="rose.400">{icon}</Box>
      )}
      <Heading as="h3" fontSize="md" fontWeight={600} color="rose.600" mb={2} textAlign="center">
        {title}
      </Heading>
      {message && (
        <Text fontSize="sm" color="warmGray.500" textAlign="center" maxW="400px" mb={6}>
          {message}
        </Text>
      )}
      <Flex gap={3}>
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack}>
            {backLabel}
          </Button>
        )}
        {onRetry && (
          <Button variant="primary" size="sm" onClick={onRetry}>
            Intentar de nuevo
          </Button>
        )}
      </Flex>
    </Flex>
  )
}

PastelErrorState.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string,
  message: PropTypes.string,
  onRetry: PropTypes.func,
  onBack: PropTypes.func,
  backLabel: PropTypes.string,
}
