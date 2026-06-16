import { Box, Flex } from '@chakra-ui/react'
import PropTypes from 'prop-types'
import Navbar from '../Navbar'

export default function Layout({ children }) {
  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Navbar />
      <Flex flex={1} position="relative">
        <Box
          as="main"
          flex={1}
          minH="calc(100vh - 64px)"
          overflowX="hidden"
        >
          {children}
        </Box>
      </Flex>
    </Box>
  )
}

Layout.propTypes = {
  children: PropTypes.node,
}
