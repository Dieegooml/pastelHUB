import { useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex, Text, IconButton, Progress } from '@chakra-ui/react';
import { storageService } from '../services/storageService';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_SIZE = 5 * 1024 * 1024;
function ImageUploader({
  currentImageUrl = '',
  onUploadComplete,
  folder = 'uploads',
  label = 'Imagen',
  aspectRatio,
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(currentImageUrl || '');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  function validateFile(file) {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
      throw new Error('Formato no permitido. Usa JPG, PNG o WebP.');
    }
    if (file.size > MAX_SIZE) {
      throw new Error('La imagen no debe superar 5MB.');
    }
  }

  const processFile = useCallback(async (file) => {
    setError('');
    try {
      validateFile(file);
      setUploading(true);
      setProgress(0);

      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);

      const url = await storageService.uploadImage(folder, file, setProgress);
      URL.revokeObjectURL(localUrl);
      setPreview(url);
      if (onUploadComplete) onUploadComplete(url);
    } catch (err) {
      setError(err.message);
      if (preview && !currentImageUrl) setPreview('');
    } finally {
      setUploading(false);
    }
  }, [folder, onUploadComplete, currentImageUrl, preview]);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    processFile(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleRemove() {
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview('');
    setError('');
    if (onUploadComplete) onUploadComplete('');
  }

  function handleClick() {
    fileInputRef.current?.click();
  }

  return (
    <Box>
      <Box
        position="relative"
        border="2px dashed"
        borderColor={dragOver ? 'accent.400' : 'brand.200'}
        borderRadius="xl"
        p={preview ? 2 : 6}
        textAlign="center"
        cursor={uploading ? 'default' : 'pointer'}
        bg={dragOver ? 'accent.50' : 'warmGray.50'}
        transition="all 0.2s"
        onClick={uploading ? undefined : handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        opacity={uploading ? 0.7 : 1}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          disabled={uploading}
          style={{ display: 'none' }}
        />

        {uploading && (
          <Flex
            position="absolute"
            inset={0}
            direction="column"
            align="center"
            justify="center"
            bg="rgba(255,255,255,0.85)"
            borderRadius="xl"
            zIndex={2}
          >
            <Progress
              value={progress}
              w="80%"
              maxW="240px"
              mb={2}
              borderRadius="full"
              size="sm"
              variant="brand"
            />
            <Text fontSize="xs" color="warmGray.600" fontWeight={500}>
              Subiendo {progress}%
            </Text>
          </Flex>
        )}

        {preview ? (
          <Box
            position="relative"
            w="full"
            maxW={aspectRatio ? '100%' : '200px'}
            mx="auto"
            {...(aspectRatio ? { aspectRatio: String(aspectRatio) } : {})}
          >
            <Box
              as="img"
              src={preview}
              alt="Vista previa"
              w="full"
              h={aspectRatio ? '100%' : '180px'}
              objectFit="cover"
              borderRadius="lg"
              display="block"
              fallback={<Box display="none" />}
            />
            {!uploading && (
              <Flex position="absolute" bottom={2} right={2} gap={1.5}>
                <IconButton
                  icon={<Text fontSize="sm">↻</Text>}
                  size="sm"
                  borderRadius="full"
                  bg="brand.900"
                  color="white"
                  _hover={{ bg: 'brand.700' }}
                  onClick={(e) => { e.stopPropagation(); handleClick(); }}
                  aria-label="Cambiar imagen"
                  boxShadow="0 2px 6px rgba(0,0,0,0.15)"
                />
                <IconButton
                  icon={<Text fontSize="sm">✕</Text>}
                  size="sm"
                  borderRadius="full"
                  bg="rose.500"
                  color="white"
                  _hover={{ bg: 'rose.600' }}
                  onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                  aria-label="Eliminar imagen"
                  boxShadow="0 2px 6px rgba(0,0,0,0.15)"
                />
              </Flex>
            )}
          </Box>
        ) : (
          <Flex direction="column" align="center" gap={1.5}>
            <Text fontSize="2xl" lineHeight="1" color="warmGray.400">
              📁
            </Text>
            <Text fontSize="sm" color="warmGray.500" fontWeight={500}>
              {dragOver ? 'Suelta la imagen aquí' : `Haz clic o arrastra ${label.toLowerCase()}`}
            </Text>
            <Text fontSize="xs" color="warmGray.400">
              JPG, PNG o WebP · Máx 5MB
            </Text>
          </Flex>
        )}
      </Box>

      {error && (
        <Flex
          mt={2}
          p={2.5}
          px={3}
          bg="rose.50"
          color="rose.600"
          borderRadius="lg"
          borderLeft="3px solid"
          borderLeftColor="rose.400"
          fontSize="xs"
          align="center"
          gap={2}
        >
          <Text>⚠️</Text>
          <Text>{error}</Text>
        </Flex>
      )}
    </Box>
  );
}

ImageUploader.propTypes = {
  currentImageUrl: PropTypes.string,
  onUploadComplete: PropTypes.func,
  folder: PropTypes.string,
  label: PropTypes.string,
  aspectRatio: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default ImageUploader;
