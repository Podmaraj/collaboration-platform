import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  MinLength,
  IsObject,
} from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  /// Initial document content (JSON — Prosemirror / Yjs compatible)
  @IsObject()
  @IsOptional()
  content?: Record<string, unknown>;
}

export class UpdateDocumentDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsObject()
  @IsOptional()
  content?: Record<string, unknown>;
}
