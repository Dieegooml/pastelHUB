import { Flex, Text, IconButton, Tooltip } from '@chakra-ui/react'
import PropTypes from 'prop-types'

const presetOptions = [1, 3, 6, 12]

export default function PastelQuantitySelector({
  value, onChange, min = 1, max = 999, showPresets = true, size = 'md',
}) {
  const btnSize = size === 'sm' ? 'xs' : 'sm'
  const textSize = size === 'sm' ? '13px' : '15px'
  const boxW = size === 'sm' ? '36px' : '44px'
  const iconSize = size === 'sm' ? '14px' : '16px'

  const minusIcon = (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )

  const plusIcon = (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )

  return (
    <Flex direction="column" gap={2}>
      <Flex align="center" gap={0}>
        <Tooltip label="Disminuir cantidad">
          <IconButton
            icon={minusIcon}
            size={btnSize}
            variant="ghost"
            bg="warmGray.100"
            isDisabled={value <= min}
            opacity={value <= min ? 0.4 : 1}
            onClick={() => onChange(Math.max(min, value - 1))}
            aria-label="Disminuir cantidad"
            borderRadius="8px 0 0 8px"
            h={size === 'sm' ? '32px' : '38px'}
            w={boxW}
            _hover={value > min ? { bg: 'brand.100' } : {}}
          />
        </Tooltip>
        <Text
          w={boxW}
          textAlign="center"
          fontFamily="body"
          fontSize={textSize}
          fontWeight={600}
          color="brand.900"
          bg="white"
          borderY="1px solid"
          borderColor="warmGray.200"
          h={size === 'sm' ? '32px' : '38px'}
          lineHeight={size === 'sm' ? '32px' : '38px'}
          transition="all 0.15s"
        >
          {value}
        </Text>
        <Tooltip label="Aumentar cantidad">
          <IconButton
            icon={plusIcon}
            size={btnSize}
            variant="ghost"
            bg="warmGray.100"
            isDisabled={value >= max}
            opacity={value >= max ? 0.4 : 1}
            onClick={() => onChange(Math.min(max, value + 1))}
            aria-label="Aumentar cantidad"
            borderRadius="0 8px 8px 0"
            h={size === 'sm' ? '32px' : '38px'}
            w={boxW}
            _hover={value < max ? { bg: 'brand.100' } : {}}
          />
        </Tooltip>
      </Flex>
      {showPresets && (
        <Flex gap={1.5} flexWrap="wrap">
          {presetOptions.map((q) => (
            <Flex
              key={q}
              as="button"
              px={2.5}
              py={1}
              borderRadius="6px"
              fontSize="12px"
              fontFamily="body"
              border="1px solid"
              borderColor={value === q ? 'accent.400' : 'warmGray.200'}
              bg={value === q ? 'accent.50' : 'white'}
              color={value === q ? 'accent.600' : 'brand.800'}
              fontWeight={value === q ? 600 : 400}
              transition="all 0.15s"
              _hover={{ bg: value === q ? 'accent.50' : 'warmGray.50' }}
              onClick={() => onChange(q)}
            >
              {q}
            </Flex>
          ))}
        </Flex>
      )}
    </Flex>
  )
}

PastelQuantitySelector.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  min: PropTypes.number,
  max: PropTypes.number,
  showPresets: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md']),
}
