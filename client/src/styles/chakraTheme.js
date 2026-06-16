import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  colors: {
    brand: {
      50: '#FDF6EE',
      100: '#F5E6D3',
      200: '#E8CDB3',
      300: '#D4A574',
      400: '#C48B5A',
      500: '#A67B4A',
      600: '#8B5E3C',
      700: '#6B4226',
      800: '#4A2F1A',
      900: '#2D1810',
    },
    accent: {
      50: '#F0FDF4',
      100: '#DCFCE7',
      200: '#BBF7D0',
      300: '#86EFAC',
      400: '#4ADE80',
      500: '#22C55E',
      600: '#16A34A',
      700: '#15803D',
      800: '#166534',
      900: '#14532D',
    },
    rose: {
      50: '#FFF1F2',
      100: '#FFE4E6',
      200: '#FECDD3',
      300: '#FDA4AF',
      400: '#FB7185',
      500: '#F43F5E',
      600: '#E11D48',
      700: '#BE123C',
      800: '#9F1239',
      900: '#881337',
    },
    warmGray: {
      50: '#FAF7F2',
      100: '#F0ECE3',
      200: '#E0D9CC',
      300: '#CEC4B4',
      400: '#B4A99A',
      500: '#9A8F80',
      600: '#7F7568',
      700: '#655C50',
      800: '#4C443B',
      900: '#332D27',
    },
  },
  fonts: {
    heading: `'Playfair Display', Georgia, serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    mono: `'JetBrains Mono', ui-monospace, monospace`,
  },
  styles: {
    global: {
      body: {
        bg: 'warmGray.50',
        color: 'brand.900',
        fontSize: '15px',
        lineHeight: 1.6,
      },
      '::selection': {
        bg: 'brand.200',
        color: 'brand.900',
      },
      '@keyframes slideInRight': {
        '0%': { opacity: 0, transform: 'translateX(100%)' },
        '100%': { opacity: 1, transform: 'translateX(0)' },
      },
      '@keyframes slideOutRight': {
        '0%': { opacity: 1, transform: 'translateX(0)' },
        '100%': { opacity: 0, transform: 'translateX(100%)' },
      },
      '@keyframes fadeIn': {
        '0%': { opacity: 0 },
        '100%': { opacity: 1 },
      },
      '@keyframes fadeInUp': {
        '0%': { opacity: 0, transform: 'translateY(20px)' },
        '100%': { opacity: 1, transform: 'translateY(0)' },
      },
      '@keyframes shimmer': {
        '0%': { backgroundPosition: '-200% 0' },
        '100%': { backgroundPosition: '200% 0' },
      },
      '@keyframes pulse': {
        '0%, 100%': { opacity: 1 },
        '50%': { opacity: 0.5 },
      },
      '@keyframes scaleIn': {
        '0%': { opacity: 0, transform: 'scale(0.95)' },
        '100%': { opacity: 1, transform: 'scale(1)' },
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'full',
        fontWeight: 600,
        fontSize: '14px',
        transition: 'all 0.2s',
      },
      sizes: {
        sm: { px: 4, py: 2, fontSize: '13px' },
        md: { px: 6, py: 3, fontSize: '14px' },
        lg: { px: 8, py: 4, fontSize: '16px' },
      },
      variants: {
        primary: {
          bg: 'brand.900',
          color: 'white',
          _hover: { bg: 'brand.800', transform: 'translateY(-1px)', shadow: 'md' },
          _active: { bg: 'brand.700' },
          _disabled: { bg: 'brand.300', cursor: 'not-allowed', _hover: { transform: 'none', shadow: 'none' } },
        },
        secondary: {
          bg: 'brand.100',
          color: 'brand.800',
          _hover: { bg: 'brand.200', transform: 'translateY(-1px)' },
        },
        ghost: {
          color: 'brand.700',
          _hover: { bg: 'brand.50' },
        },
        outline: {
          border: '1.5px solid',
          borderColor: 'brand.200',
          color: 'brand.800',
          _hover: { bg: 'brand.50', borderColor: 'brand.300' },
        },
        danger: {
          bg: 'rose.50',
          color: 'rose.600',
          _hover: { bg: 'rose.100' },
        },
        accent: {
          bg: 'accent.500',
          color: 'white',
          _hover: { bg: 'accent.600', transform: 'translateY(-1px)', shadow: 'md' },
        },
      },
      defaultProps: { variant: 'primary', size: 'md' },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          borderRadius: 'xl',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
          border: '1px solid',
          borderColor: 'brand.100',
          overflow: 'hidden',
          transition: 'all 0.2s',
        },
      },
      variants: {
        elevated: {
          container: {
            boxShadow: '0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
            border: '1px solid',
            borderColor: 'brand.50',
          },
        },
        interactive: {
          container: {
            cursor: 'pointer',
            _hover: {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.08), 0 2px 5px rgba(0,0,0,0.04)',
            },
          },
        },
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            borderRadius: 'lg',
            border: '1.5px solid',
            borderColor: 'brand.200',
            bg: 'white',
            color: 'brand.900',
            fontSize: '14px',
            _placeholder: { color: 'warmGray.400' },
            _hover: { borderColor: 'brand.300' },
            _focus: { borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(164, 123, 74, 0.12)', outline: 'none' },
          },
        },
      },
      defaultProps: { variant: 'outline' },
    },
    Select: {
      variants: {
        outline: {
          field: {
            borderRadius: 'lg',
            border: '1.5px solid',
            borderColor: 'brand.200',
            bg: 'white',
            color: 'brand.900',
            fontSize: '14px',
            _hover: { borderColor: 'brand.300' },
            _focus: { borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(164, 123, 74, 0.12)' },
          },
        },
      },
      defaultProps: { variant: 'outline' },
    },
    Textarea: {
      variants: {
        outline: {
          borderRadius: 'lg',
          border: '1.5px solid',
          borderColor: 'brand.200',
          bg: 'white',
          _hover: { borderColor: 'brand.300' },
          _focus: { borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(164, 123, 74, 0.12)' },
        },
      },
      defaultProps: { variant: 'outline' },
    },
    Badge: {
      baseStyle: {
        borderRadius: 'full',
        px: 3,
        py: 0.5,
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      },
      variants: {
        subtle: {
          px: 3,
          py: 0.5,
        },
      },
    },
    Table: {
      variants: {
        pastel: {
          table: {
            bg: 'white',
            borderRadius: 'xl',
            overflow: 'hidden',
          },
          th: {
            borderBottom: '2px solid',
            borderColor: 'brand.100',
            color: 'brand.600',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: 700,
            py: 4,
            px: 4,
            bg: 'warmGray.50',
          },
          td: {
            borderBottom: '1px solid',
            borderColor: 'brand.50',
            py: 3.5,
            px: 4,
            fontSize: '14px',
          },
          tr: {
            _hover: { bg: 'warmGray.50' },
            _last: { td: { borderBottom: 'none' } },
          },
        },
      },
      defaultProps: { variant: 'pastel' },
    },
    Modal: {
      baseStyle: {
        dialog: {
          borderRadius: '2xl',
          bg: 'white',
        },
        header: {
          borderBottom: '1px solid',
          borderColor: 'brand.100',
          pb: 4,
          fontSize: 'lg',
          fontWeight: 700,
          color: 'brand.900',
        },
        body: {
          py: 6,
        },
        footer: {
          borderTop: '1px solid',
          borderColor: 'brand.100',
          pt: 4,
        },
        closeButton: {
          borderRadius: 'full',
          _hover: { bg: 'brand.100' },
        },
      },
    },
    Tabs: {
      variants: {
        'brand-underline': {
          tab: {
            color: 'warmGray.500',
            fontWeight: 600,
            fontSize: '14px',
            _selected: {
              color: 'brand.800',
              borderColor: 'brand.600',
              borderBottomWidth: '2.5px',
            },
            _hover: {
              color: 'brand.600',
            },
          },
          tablist: {
            borderBottom: '1.5px solid',
            borderColor: 'brand.100',
            gap: 1,
          },
          indicator: {
            bg: 'brand.600',
            height: '2.5px',
          },
        },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          borderRadius: 'xl',
          border: '1px solid',
          borderColor: 'brand.100',
          boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
          py: 2,
        },
        item: {
          fontSize: '14px',
          color: 'brand.800',
          _hover: { bg: 'brand.50' },
          _focus: { bg: 'brand.50' },
        },
      },
    },
    Tooltip: {
      baseStyle: {
        borderRadius: 'md',
        bg: 'brand.900',
        color: 'white',
        fontSize: '12px',
        px: 3,
        py: 1.5,
      },
    },
    Divider: {
      baseStyle: {
        borderColor: 'brand.100',
      },
    },
    Spinner: {
      baseStyle: {
        color: 'brand.500',
        speed: '0.6s',
      },
    },
    Progress: {
      variants: {
        brand: {
          filledTrack: {
            bg: 'brand.500',
          },
          track: {
            bg: 'brand.100',
            borderRadius: 'full',
          },
        },
      },
      defaultProps: { variant: 'brand' },
    },
    Switch: {
      baseStyle: {
        track: {
          bg: 'brand.200',
          _checked: { bg: 'accent.500' },
        },
      },
    },
    Alert: {
      variants: {
        subtle: {
          container: {
            borderRadius: 'lg',
          },
        },
      },
    },
    Drawer: {
      baseStyle: {
        dialog: {
          bg: 'white',
        },
        overlay: {
          bg: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(4px)',
        },
      },
    },
  },
})

export default theme
