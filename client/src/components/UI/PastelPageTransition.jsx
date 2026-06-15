import { motion } from 'framer-motion'
import PropTypes from 'prop-types'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export default function PastelPageTransition({ children, duration = 0.35, ...rest }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ duration, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ width: '100%' }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

PastelPageTransition.propTypes = {
  children: PropTypes.node,
  duration: PropTypes.number,
}
