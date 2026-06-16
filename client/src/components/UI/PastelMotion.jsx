import { Box } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`
const slideInRight = keyframes`from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); }`
const slideInLeft = keyframes`from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); }`
const slideInUp = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`
const scaleIn = keyframes`from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); }`

export function PastelFadeIn({ children, delay = 0, duration = 0.3 }) {
  return (
    <Box animation={`${fadeIn} ${duration}s ease both`} animationDelay={`${delay}s`}>
      {children}
    </Box>
  )
}

export function PastelSlideIn({ children, delay = 0, duration = 0.3, direction = 'up' }) {
  const animMap = { right: slideInRight, left: slideInLeft, up: slideInUp }
  const anim = animMap[direction] || slideInUp
  return (
    <Box animation={`${anim} ${duration}s ease both`} animationDelay={`${delay}s`}>
      {children}
    </Box>
  )
}

export function PastelScaleIn({ children, delay = 0, duration = 0.3 }) {
  return (
    <Box animation={`${scaleIn} ${duration}s ease both`} animationDelay={`${delay}s`}>
      {children}
    </Box>
  )
}

export function PastelStagger({ children }) {
  return children
}

export function PastelHoverScale({ children }) {
  return (
    <Box transition="transform 0.2s ease" _hover={{ transform: 'scale(1.05)' }}>
      {children}
    </Box>
  )
}

export function PastelHoverLift({ children }) {
  return (
    <Box transition="transform 0.2s ease, box-shadow 0.2s ease" _hover={{ transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
      {children}
    </Box>
  )
}
