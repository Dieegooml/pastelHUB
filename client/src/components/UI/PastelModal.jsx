import { Box, Text, Flex, IconButton } from '@chakra-ui/react'
import PropTypes from 'prop-types'
import { font } from '../../styles/theme'

export default function PastelModal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null

  const widthMap = { sm: '360px', md: '480px', lg: '640px', xl: '800px' }

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
        borderRadius="16px"
        maxW={widthMap[size] || '480px'}
        w="92%"
        maxH="85vh"
        overflow="hidden"
        display="flex"
        flexDirection="column"
        boxShadow="0 10px 40px rgba(0,0,0,0.15)"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <Flex
            px={5}
            py={4}
            borderBottom="1px solid"
            borderColor="brand.100"
            justify="space-between"
            align="center"
          >
            <Text fontSize="md" fontWeight={600} fontFamily={font.heading}>{title}</Text>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ✕
            </IconButton>
          </Flex>
        )}
        <Box p={5} overflowY="auto">
          {children}
        </Box>
      </Box>
    </Box>
  )
}

PastelModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
  size: PropTypes.string,
}
