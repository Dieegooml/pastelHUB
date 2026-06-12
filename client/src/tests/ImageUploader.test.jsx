import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ImageUploader from '../components/ImageUploader';

vi.mock('../services/storageService', () => ({
  storageService: { uploadImage: vi.fn() },
}));

import { storageService } from '../services/storageService';

const createMockFile = () => {
  const file = new File(['fake-image-content'], 'test-image.png', { type: 'image/png' });
  Object.defineProperty(file, 'size', { value: 1024 * 100 });
  return file;
};

describe('ImageUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el label y drop zone inicialmente', () => {
    render(<ImageUploader label="Foto de perfil" />);
    expect(screen.getByText('Haz clic o arrastra foto de perfil')).toBeInTheDocument();
    expect(screen.getByText('JPG, PNG o WebP · Máx 5MB')).toBeInTheDocument();
  });

  it('muestra preview cuando hay currentImageUrl', () => {
    render(<ImageUploader currentImageUrl="https://example.com/img.jpg" />);
    const img = screen.getByAltText('Vista previa');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/img.jpg');
  });

  it('llama a onUploadComplete al seleccionar archivo', async () => {
    const onUploadComplete = vi.fn();
    storageService.uploadImage.mockResolvedValue('https://mock.url/image.jpg');
    const { container } = render(
      <ImageUploader onUploadComplete={onUploadComplete} folder="logos" />
    );
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [createMockFile()] } });
    await waitFor(() => {
      expect(onUploadComplete).toHaveBeenCalledWith('https://mock.url/image.jpg');
    });
    expect(storageService.uploadImage).toHaveBeenCalledWith(
      'logos', expect.any(File), expect.any(Function)
    );
  });

  it('muestra progreso de upload', async () => {
    let progressCallback;
    storageService.uploadImage.mockImplementation((_f, _file, onProgress) => {
      progressCallback = onProgress;
      return new Promise(() => {});
    });
    const { container } = render(<ImageUploader />);
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [createMockFile()] } });
    await waitFor(() => {
      expect(screen.getByText('Subiendo 0%')).toBeInTheDocument();
    });
    progressCallback(50);
    await waitFor(() => {
      expect(screen.getByText('Subiendo 50%')).toBeInTheDocument();
    });
  });

  it('muestra error cuando el tipo de archivo no es valido', async () => {
    const { container } = render(<ImageUploader />);
    const input = container.querySelector('input[type="file"]');
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    Object.defineProperty(file, 'size', { value: 1024 * 100 });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(
        screen.getByText('Formato no permitido. Usa JPG, PNG o WebP.')
      ).toBeInTheDocument();
    });
  });

  it('muestra error cuando el archivo es muy grande (>5MB)', async () => {
    const { container } = render(<ImageUploader />);
    const input = container.querySelector('input[type="file"]');
    const file = new File(['content'], 'big.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(
        screen.getByText('La imagen no debe superar 5MB.')
      ).toBeInTheDocument();
    });
  });

  it('remueve la imagen al hacer click en remove', async () => {
    const onUploadComplete = vi.fn();
    render(
      <ImageUploader
        currentImageUrl="https://example.com/img.jpg"
        onUploadComplete={onUploadComplete}
      />
    );
    fireEvent.click(screen.getByTitle('Eliminar imagen'));
    await waitFor(() => {
      expect(screen.queryByAltText('Vista previa')).not.toBeInTheDocument();
    });
    expect(onUploadComplete).toHaveBeenCalledWith('');
    expect(screen.getByText('Haz clic o arrastra imagen')).toBeInTheDocument();
  });

  it('muestra feedback visual durante drag over', async () => {
    const { container } = render(<ImageUploader />);
    const input = container.querySelector('input[type="file"]');
    const dropZone = input.parentElement;
    fireEvent.dragOver(dropZone);
    await waitFor(() => {
      expect(screen.getByText('Suelta la imagen aquí')).toBeInTheDocument();
    });
    fireEvent.dragLeave(dropZone);
    await waitFor(() => {
      expect(screen.getByText('Haz clic o arrastra imagen')).toBeInTheDocument();
    });
  });

  it('soporta drag & drop para subir archivo', async () => {
    const onUploadComplete = vi.fn();
    storageService.uploadImage.mockResolvedValue('https://mock.url/image.jpg');
    const { container } = render(<ImageUploader onUploadComplete={onUploadComplete} />);
    const input = container.querySelector('input[type="file"]');
    const dropZone = input.parentElement;
    fireEvent.drop(dropZone, { dataTransfer: { files: [createMockFile()] } });
    await waitFor(() => {
      expect(onUploadComplete).toHaveBeenCalledWith('https://mock.url/image.jpg');
    });
  });

  it('deshabilita el input durante upload', async () => {
    storageService.uploadImage.mockReturnValue(new Promise(() => {}));
    const { container } = render(<ImageUploader />);
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [createMockFile()] } });
    await waitFor(() => {
      expect(input).toBeDisabled();
    });
  });
});
