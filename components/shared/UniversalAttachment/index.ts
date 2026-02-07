// Barrel export for UniversalAttachment system
export { UniversalAttachment } from './UniversalAttachment';
export { AttachmentPreview } from './AttachmentPreview';
export { AttachmentThumbnail } from './AttachmentThumbnail';
export { FileTypeIcon } from './FileTypeIcon';
export { useFileUpload } from './hooks/useFileUpload';
export { useDragAndDrop } from './hooks/useDragAndDrop';
export { useFileValidation } from './hooks/useFileValidation';
export { buildAttachmentContext, getImageAttachmentsForMultimodal } from './utils/contextBuilder';
export { processFile, createAttachmentFile } from './utils/fileProcessors';
export { formatFileSize, detectCategory, isAllowedMimeType } from './utils/mimeTypes';
export type { AttachmentFile, AttachmentConfig, AttachmentPurpose, AttachmentStatus, FileCategory } from './types';
export { ATTACHMENT_CONFIGS, DEFAULT_ATTACHMENT_CONFIG, PURPOSE_LABELS, PURPOSE_ICONS } from './types';
