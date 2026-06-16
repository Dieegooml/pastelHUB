import { Box, Text, Flex } from '@chakra-ui/react'
import PropTypes from 'prop-types'
import { font, colors } from '../../styles/theme'

export default function PastelTable({ columns, data, onRowClick, ...rest }) {
  return (
    <Box
      bg="white"
      borderRadius="12px"
      border="1px solid"
      borderColor="brand.100"
      overflow="hidden"
      fontFamily={font.body}
      fontSize="13px"
      {...rest}
    >
      <Flex bg="brand.50" borderBottom="1px solid" borderColor="brand.100">
        {columns.map((col, i) => (
          <Box
            key={i}
            flex={col.flex || 1}
            px={4}
            py={3}
            fontSize="11px"
            fontWeight={600}
            color="brand.500"
            textTransform="uppercase"
            letterSpacing="0.5px"
          >
            {col.header}
          </Box>
        ))}
      </Flex>
      {data.map((row, ri) => (
        <Flex
          key={ri}
          borderBottom={ri < data.length - 1 ? '1px solid' : 'none'}
          borderColor="brand.100"
          bg={ri % 2 === 0 ? 'white' : 'brand.50'}
          cursor={onRowClick ? 'pointer' : 'default'}
          _hover={onRowClick ? { bg: 'brand.100' } : {}}
          onClick={() => onRowClick && onRowClick(row)}
        >
          {columns.map((col, ci) => (
            <Box
              key={ci}
              flex={col.flex || 1}
              px={4}
              py={3}
              fontSize="13px"
              color="brand.900"
            >
              {col.render ? col.render(row) : row[col.accessor]}
            </Box>
          ))}
        </Flex>
      ))}
    </Box>
  )
}

PastelTable.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.shape({
    header: PropTypes.string.isRequired,
    accessor: PropTypes.string,
    render: PropTypes.func,
    flex: PropTypes.number,
  })).isRequired,
  data: PropTypes.array.isRequired,
  onRowClick: PropTypes.func,
}
