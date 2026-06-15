import { Box, Flex, Heading, Text, Button } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'

const defaultIcon = (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C48B5A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

export default function PastelEmptyState({ icon = defaultIcon, title, description, actionLabel, actionPath, onAction }) {
  const navigate = useNavigate()

  const handleAction = () => {
    if (onAction) onAction()
    else if (actionPath) navigate(actionPath)
  }

  return (
    <Flex direction="column" align="center" justify="center" py={16} px={4}>
      {typeof icon === 'string' ? (
        <Box fontSize="4xl" mb={4}>{icon}</Box>
      ) : (
        <Box mb={4} color="brand.300">{icon}</Box>
      )}
      <Heading as="h3" fontSize="md" fontWeight={600} color="brand.700" mb={2} textAlign="center">
        {title}
      </Heading>
      {description && (
        <Text fontSize="sm" color="warmGray.500" textAlign="center" maxW="400px" mb={6}>
          {description}
        </Text>
      )}
      {(actionLabel && (actionPath || onAction)) && (
        <Button variant="primary" size="sm" onClick={handleAction}>
          {actionLabel}
        </Button>
      )}
    </Flex>
  )
}

PastelEmptyState.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  actionLabel: PropTypes.string,
  actionPath: PropTypes.string,
  onAction: PropTypes.func,
}
