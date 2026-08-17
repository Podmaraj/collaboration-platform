import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Document } from '@prisma/client';
import { DocumentsRepository } from './documents.repository';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/document.dto';
import {
  paginate,
  PaginatedResult,
  PaginationOptions,
} from '../../common/utils/pagination.util';

@Injectable()
export class DocumentsService {
  constructor(private readonly documentsRepository: DocumentsRepository) {}

  async create(
    workspaceId: string,
    dto: CreateDocumentDto,
    userId: string,
  ): Promise<Document> {
    return this.documentsRepository.create({
      workspaceId,
      title: dto.title,
      content: dto.content,
      createdBy: userId,
    });
  }

  async findAll(
    workspaceId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<Document>> {
    const [items, total] = await this.documentsRepository.findAllByWorkspace(
      workspaceId,
      options,
    );
    return paginate(items, total, options);
  }

  async findOne(workspaceId: string, documentId: string): Promise<Document> {
    const doc = await this.documentsRepository.findById(documentId);
    if (!doc || doc.workspaceId !== workspaceId) {
      throw new NotFoundException({
        code: 'DOCUMENT_NOT_FOUND',
        message: 'Document not found',
      });
    }
    return doc;
  }

  async update(
    workspaceId: string,
    documentId: string,
    dto: UpdateDocumentDto,
  ): Promise<Document> {
    // Verify it belongs to this workspace
    await this.findOne(workspaceId, documentId);
    return this.documentsRepository.update(documentId, dto);
  }

  async remove(
    workspaceId: string,
    documentId: string,
    requestingUserId: string,
  ): Promise<void> {
    const doc = await this.findOne(workspaceId, documentId);

    // Only the creator or workspace OWNER/ADMIN (enforced by guard at controller)
    // can delete; here we also restrict non-creator MEMBERs via the service layer.
    // Controllers applying OWNER/ADMIN guards bypass this check automatically.
    if (doc.createdBy !== requestingUserId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Only the document creator may delete this document',
      });
    }

    await this.documentsRepository.delete(documentId);
  }
}
