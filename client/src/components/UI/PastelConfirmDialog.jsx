import { Box, Text, Button, Flex } from '@chakra-ui/react'
import PropTypes from 'prop-types'
import { font } from '../../styles/theme'

export default function PastelConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, isLoading }) {
  if (!isOpen) return null
  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={9999}
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="rgba(0,0,0,0.4)"
      onClick={onClose}
    >
      <Box
        bg="white"
        p={6}
        borderRadius="16px"
        maxW="400px"
        w="90%"
        boxShadow="0 10px 40px rgba(0,0,0,0.1)"
        onClick={(e) => e.stopPropagation()}
      >
        <Text fontSize="lg" fontWeight={600} mb={2} fontFamily={font.heading}>{title || 'Confirmar'}</Text>
        <Text fontSize="sm" color="gray.600" mb={6}>{message || '¿Estás seguro?'}</Text>
        <Flex gap={3} justify="flex-end">
          <Button variant="ghost" size="sm" onClick={onClose} isDisabled={isLoading}>
            {cancelText || 'Cancelar'}
          </Button>
          <Button colorScheme="red" size="sm" onClick={onConfirm} isLoading={isLoading}>
            {confirmText || 'Confirmar'}
          </Button>
        </Flex>
      </Box>
    </Box>
  )
}

PastelConfirmDialog.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  onConfirm: PropTypes.func,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  isLoading: PropTypes.bool,
}
