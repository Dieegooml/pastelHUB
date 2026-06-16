import { Tooltip as ChakraTooltip } from '@chakra-ui/react';
import PropTypes from 'prop-types';

export default function Tooltip({ text, children, position = 'top' }) {
  return (
    <ChakraTooltip label={text} placement={position} hasArrow>
      {children}
    </ChakraTooltip>
  );
}

Tooltip.propTypes = {
  text: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
};
