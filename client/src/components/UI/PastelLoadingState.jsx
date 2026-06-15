import { Box, Flex } from '@chakra-ui/react'
import PropTypes from 'prop-types'

function SkeletonBox({ w, h, borderRadius = 'md', mb = 0, ...rest }) {
  return (
    <Box
      w={w || 'full'}
      h={h || '16px'}
      borderRadius={borderRadius}
      bg="warmGray.100"
      position="relative"
      overflow="hidden"
      mb={mb}
      className="pastel-skeleton"
      {...rest}
    />
  )
}

SkeletonBox.propTypes = {
  w: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  h: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  borderRadius: PropTypes.string,
  mb: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

export function PastelSkeletonHero() {
  return (
    <Box bg="warmGray.200" px={{ base: 4, md: 8 }} py={{ base: 12, md: 16 }}>
      <Box maxW="900px" mx="auto">
        <SkeletonBox h="48px" w="60%" mb={3} borderRadius="8px" />
        <SkeletonBox h="16px" w="80%" mb={2} borderRadius="6px" />
        <SkeletonBox h="16px" w="40%" mb={6} borderRadius="6px" />
        <SkeletonBox h="48px" w="500px" maxW="full" borderRadius="14px" />
      </Box>
    </Box>
  )
}

export function PastelSkeletonShopCard() {
  return (
    <Box bg="white" borderRadius="xl" overflow="hidden" border="1px solid" borderColor="brand.100">
      <SkeletonBox h="160px" borderRadius={0} />
      <Box px={6} pb={6} position="relative">
        <Box mt="-36px" mb={3}>
          <SkeletonBox w="72px" h="72px" borderRadius="50%" />
        </Box>
        <SkeletonBox h="22px" w="70%" mb={2} borderRadius="6px" />
        <SkeletonBox h="14px" w="50%" mb={2.5} borderRadius="4px" />
        <SkeletonBox h="13px" w="full" mb={1} borderRadius="4px" />
        <SkeletonBox h="13px" w="85%" mb={3.5} borderRadius="4px" />
        <Flex gap={1.5}>
          <SkeletonBox w="60px" h="20px" borderRadius="99px" />
          <SkeletonBox w="50px" h="20px" borderRadius="99px" />
          <SkeletonBox w="70px" h="20px" borderRadius="99px" />
        </Flex>
      </Box>
    </Box>
  )
}

export function PastelSkeletonProductGrid({ count = 6 }) {
  return (
    <SimpleGridElement columns={{ base: 2, sm: 3, md: 2, lg: 3 }} gap={4}>
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i} bg="white" borderRadius="xl" overflow="hidden" border="1px solid" borderColor="brand.100">
          <SkeletonBox h="140px" borderRadius={0} />
          <Box p={3}>
            <SkeletonBox h="15px" w="80%" mb={2} borderRadius="4px" />
            <SkeletonBox h="11px" w="full" mb={1.5} borderRadius="3px" />
            <SkeletonBox h="11px" w="60%" mb={3} borderRadius="3px" />
            <Flex justify="space-between" align="center" pt={1.5} borderTop="1px solid" borderTopColor="brand.50">
              <SkeletonBox h="16px" w="60px" borderRadius="4px" />
              <SkeletonBox h="28px" w="70px" borderRadius="99px" />
            </Flex>
          </Box>
        </Box>
      ))}
    </SimpleGridElement>
  )
}

PastelSkeletonProductGrid.propTypes = { count: PropTypes.number }

// SimpleGrid component that handles responsive columns inline
function SimpleGridElement({ columns, children, gap }) {
  const colDef = columns.base || 1
  const sm = columns.sm || colDef
  const md = columns.md || sm
  const lg = columns.lg || md

  return (
    <Box
      display="grid"
      gridTemplateColumns={{
        base: `repeat(${colDef}, 1fr)`,
        sm: `repeat(${sm}, 1fr)`,
        md: `repeat(${md}, 1fr)`,
        lg: `repeat(${lg}, 1fr)`,
      }}
      gap={gap || 4}
    >
      {children}
    </Box>
  )
}

SimpleGridElement.propTypes = {
  columns: PropTypes.object,
  children: PropTypes.node,
  gap: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

export function PastelSkeletonCartItem() {
  return (
    <Box bg="white" borderRadius="xl" p={4} border="1px solid" borderColor="brand.100">
      <Flex gap={4} align="center">
        <SkeletonBox w="56px" h="56px" borderRadius="lg" flexShrink={0} />
        <Box flex={1}>
          <SkeletonBox h="14px" w="60%" mb={2} borderRadius="4px" />
          <SkeletonBox h="12px" w="40%" borderRadius="4px" />
        </Box>
        <Flex gap={2} align="center">
          <SkeletonBox w="30px" h="30px" borderRadius="full" />
          <SkeletonBox w="24px" h="14px" borderRadius="4px" />
          <SkeletonBox w="30px" h="30px" borderRadius="full" />
        </Flex>
        <SkeletonBox w="80px" h="16px" borderRadius="4px" />
      </Flex>
    </Box>
  )
}

export function PastelSkeletonSidebar() {
  return (
    <Box>
      {Array.from({ length: 6 }).map((_, i) => (
        <Flex key={i} align="center" gap={3} py={2.5} px={3}>
          <SkeletonBox w="20px" h="20px" borderRadius="6px" />
          <SkeletonBox h="14px" w={`${50 + (i % 3) * 15}%`} borderRadius="4px" />
        </Flex>
      ))}
    </Box>
  )
}

export function PastelSkeletonReview() {
  return (
    <Box py={3}>
      <Flex align="center" gap={1} mb={1}>
        {[1, 2, 3, 4, 5].map((s) => (
          <SkeletonBox key={s} w="14px" h="14px" borderRadius="sm" />
        ))}
      </Flex>
      <SkeletonBox h="12px" w="full" mb={1} borderRadius="3px" />
      <SkeletonBox h="12px" w="70%" mb={1} borderRadius="3px" />
    </Box>
  )
}

export function PastelSkeletonCard({ lines = 3, h = '200px' }) {
  return (
    <Box bg="white" borderRadius="xl" p={5} border="1px solid" borderColor="brand.100">
      <SkeletonBox h={h} borderRadius="lg" mb={4} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox key={i} h={3} w={`${70 - i * 10}%`} mb={3} borderRadius="4px" />
      ))}
    </Box>
  )
}

PastelSkeletonCard.propTypes = { lines: PropTypes.number, h: PropTypes.string }

export function PastelSkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <Box bg="white" borderRadius="xl" p={5} border="1px solid" borderColor="brand.100">
      <Flex gap={4} mb={4}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBox key={i} h={4} flex={1} borderRadius="4px" />
        ))}
      </Flex>
      {Array.from({ length: rows }).map((_, i) => (
        <Flex key={i} gap={4} py={3} borderTop="1px solid" borderColor="brand.50">
          {Array.from({ length: cols }).map((_, j) => (
            <SkeletonBox key={j} h={3} flex={1} borderRadius="4px" />
          ))}
        </Flex>
      ))}
    </Box>
  )
}

PastelSkeletonTable.propTypes = { rows: PropTypes.number, cols: PropTypes.number }

export function PastelSkeletonPage({ cards = 3 }) {
  return (
    <Box>
      <SkeletonBox h={8} w="250px" mb={2} borderRadius="md" />
      <SkeletonBox h={4} w="400px" mb={6} borderRadius="md" />
      <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
        {Array.from({ length: cards }).map((_, i) => (
          <Box key={i} flex={1} bg="white" borderRadius="xl" p={5} border="1px solid" borderColor="brand.100">
            <SkeletonBox w="40px" h="40px" borderRadius="50%" mb={4} />
            {[1, 2, 3].map((j) => (
              <SkeletonBox key={j} h={3} w={`${70 - j * 10}%`} mb={3} borderRadius="4px" />
            ))}
          </Box>
        ))}
      </Flex>
      <Box mt={6} bg="white" borderRadius="xl" p={5} border="1px solid" borderColor="brand.100">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBox key={i} h={3} w={`${90 - (i % 5) * 8}%`} mb={4} borderRadius="4px" />
        ))}
      </Box>
    </Box>
  )
}

PastelSkeletonPage.propTypes = { cards: PropTypes.number }
