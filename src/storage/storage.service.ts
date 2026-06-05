import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly client: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.client = new S3Client({
      endpoint: this.configService.getOrThrow<string>('storage.endpoint'),
      region: this.configService.getOrThrow<string>('storage.region'),
      forcePathStyle: this.configService.getOrThrow<boolean>('storage.forcePathStyle'),
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('storage.accessKey'),
        secretAccessKey: this.configService.getOrThrow<string>('storage.secretKey'),
      },
    });
  }

  async createUploadUrl(storageKey: string, fileType: string) {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.configService.getOrThrow<string>('storage.bucket'),
        Key: storageKey,
        ContentType: fileType,
      }),
      { expiresIn: 60 * 10 },
    );
  }

  async createDownloadUrl(storageKey: string) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.configService.getOrThrow<string>('storage.bucket'),
        Key: storageKey,
      }),
      { expiresIn: 60 * 10 },
    );
  }
}
