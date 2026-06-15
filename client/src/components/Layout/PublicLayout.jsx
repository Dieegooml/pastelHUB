import { Box, Flex } from '@chakra-ui/react'
import PropTypes from 'prop-types'
import PublicTopbar from './PublicTopbar'

export default function PublicLayout({ children }) {
  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <PublicTopbar />
      <Flex flex={1} position="relative">
        <Box
          as="main"
          flex={1}
          minH="calc(100vh - 57px)"
          overflowX="hidden"
        >
          {children}
        </Box>
      </Flex>
    </Box>
  )
}

PublicLayout.propTypes = {
  children: PropTypes.node,
}
