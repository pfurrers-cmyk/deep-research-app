// hooks/useDragAndDrop.ts — Drag-and-drop support for file upload

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseDragAndDropOptions {
  onDrop: (files: File[]) => void;
  disabled?: boolean;
}

export function useDragAndDrop({ onDrop, disabled = false }: UseDragAndDropOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleDragEnter = useCallback(
    (e: DragEvent | React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      dragCounterRef.current++;
      if (e.dataTransfer?.items?.length) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback(
    (e: DragEvent | React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragging(false);
      }
    },
    []
  );

  const handleDragOver = useCallback(
    (e: DragEvent | React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    []
  );

  const handleDrop = useCallback(
    (e: DragEvent | React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;
      if (disabled) return;

      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length > 0) {
        onDrop(files);
      }
    },
    [onDrop, disabled]
  );

  // Global window drag listener for floating dropzone effect
  useEffect(() => {
    if (disabled) return;

    const onWindowDragEnter = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types?.includes('Files')) {
        dragCounterRef.current++;
        setIsDragging(true);
      }
    };

    const onWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current--;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDragging(false);
      }
    };

    const onWindowDrop = (e: DragEvent) => {
      // Only reset drag state — actual file handling is on the dropzone
      dragCounterRef.current = 0;
      setIsDragging(false);
    };

    window.addEventListener('dragenter', onWindowDragEnter);
    window.addEventListener('dragleave', onWindowDragLeave);
    window.addEventListener('drop', onWindowDrop);

    return () => {
      window.removeEventListener('dragenter', onWindowDragEnter);
      window.removeEventListener('dragleave', onWindowDragLeave);
      window.removeEventListener('drop', onWindowDrop);
    };
  }, [disabled]);

  const dropZoneProps = {
    onDragEnter: handleDragEnter as unknown as React.DragEventHandler,
    onDragLeave: handleDragLeave as unknown as React.DragEventHandler,
    onDragOver: handleDragOver as unknown as React.DragEventHandler,
    onDrop: handleDrop as unknown as React.DragEventHandler,
  };

  return {
    isDragging,
    dropZoneRef,
    dropZoneProps,
  };
}
