import type { MediaRole } from "./enum/role.enum.js";

interface MediaAssetPayload {
    readonly id: string;
    readonly assetRole: MediaRole;
    
    readonly mimeType: string;
    readonly size: number;
    readonly checksum: string;
    
    readonly storageProvider: string;
    readonly bucketName: string;
    readonly objectKey: string;
    
    readonly uploadedAt: Date;
    readonly uploadedBy: string;
    readonly isActive: boolean;
}

class MediaAsset {
  readonly id: string;
  readonly assetRole: MediaRole;

  readonly mimeType: string;
  readonly size: number;
  readonly checksum: string;

  readonly storageProvider: string;
  readonly bucketName: string;
  readonly objectKey: string;

  readonly uploadedAt: Date;
  readonly uploadedBy: string;

  isActive: boolean;

  constructor(payload: MediaAssetPayload) {
    this.id = payload.id;
    this.assetRole = payload.assetRole;
    this.storageProvider = payload.storageProvider;
    this.bucketName = payload.bucketName;
    this.objectKey = payload.objectKey;
    this.mimeType = payload.mimeType;
    this.size = payload.size;
    this.checksum = payload.checksum;
    this.uploadedAt = payload.uploadedAt;
    this.uploadedBy = payload.uploadedBy;
    this.isActive = payload.isActive;
  }
}

export default MediaAsset;