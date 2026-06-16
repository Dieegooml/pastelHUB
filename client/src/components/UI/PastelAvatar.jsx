import { Avatar } from '@chakra-ui/react'
import PropTypes from 'prop-types'

export default function PastelAvatar({ src, name, size = 'md', ...rest }) {
  return (
    <Avatar
      src={src}
      name={name}
      size={size}
      bg="brand.200"
      color="brand.800"
      {...rest}
    />
  )
}

PastelAvatar.propTypes = {
  src: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.string,
}
