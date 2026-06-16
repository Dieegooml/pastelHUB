import { Flex, Text, Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import PropTypes from 'prop-types'
import { font, colors } from '../../styles/theme'

export default function PastelPageHeader({ title, description, actions, breadcrumbs }) {
  return (
    <Flex direction="column" gap={1} mb={6}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb
          spacing="4px"
          separator={<Text fontSize="xs" color="brand.400">/</Text>}
          fontSize="xs"
          color="brand.500"
          mb={1}
        >
          {breadcrumbs.map((b, i) => (
            <BreadcrumbItem key={i}>
              {b.href ? (
                <BreadcrumbLink as={RouterLink} to={b.href} color="brand.600" _hover={{ color: 'brand.900' }}>
                  {b.label}
                </BreadcrumbLink>
              ) : (
                <Text color="brand.900" fontWeight={500}>{b.label}</Text>
              )}
            </BreadcrumbItem>
          ))}
        </Breadcrumb>
      )}
      <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
        <Flex direction="column" gap={1}>
          {title && (
            <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight={700} color="brand.900" fontFamily={font.heading}>
              {title}
            </Text>
          )}
          {description && (
            <Text fontSize="sm" color="brand.500">{description}</Text>
          )}
        </Flex>
        {actions && <Flex gap={2}>{actions}</Flex>}
      </Flex>
    </Flex>
  )
}

PastelPageHeader.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  actions: PropTypes.node,
  breadcrumbs: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    href: PropTypes.string,
  })),
}
