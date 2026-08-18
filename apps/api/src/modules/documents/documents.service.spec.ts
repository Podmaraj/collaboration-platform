import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsRepository } from './documents.repository';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockDocumentsRepository = {
  create: jest.fn(),
  findAllByWorkspace: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockDoc = {
  id: 'doc-1',
  workspaceId: 'ws-1',
  title: 'Test Doc',
  content: { type: 'doc' },
  createdBy: 'user-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DocumentsService', () => {
  let service: DocumentsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: DocumentsRepository, useValue: mockDocumentsRepository },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create and return a document', async () => {
      mockDocumentsRepository.create.mockResolvedValue(mockDoc);

      const result = await service.create('ws-1', { title: 'Test Doc' }, 'user-1');

      expect(result).toEqual(mockDoc);
      expect(mockDocumentsRepository.create).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        title: 'Test Doc',
        content: undefined,
        createdBy: 'user-1',
      });
    });
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return a paginated result of documents', async () => {
      mockDocumentsRepository.findAllByWorkspace.mockResolvedValue([[mockDoc], 1]);

      const result = await service.findAll('ws-1', { page: 1, limit: 20 });

      expect(result.data).toEqual([mockDoc]);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  // ── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a document that belongs to the workspace', async () => {
      mockDocumentsRepository.findById.mockResolvedValue(mockDoc);

      const result = await service.findOne('ws-1', 'doc-1');

      expect(result).toEqual(mockDoc);
    });

    it('should throw NotFoundException if document does not exist', async () => {
      mockDocumentsRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('ws-1', 'doc-999')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if document belongs to a different workspace', async () => {
      mockDocumentsRepository.findById.mockResolvedValue({ ...mockDoc, workspaceId: 'ws-other' });

      await expect(service.findOne('ws-1', 'doc-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update and return the document', async () => {
      const updated = { ...mockDoc, title: 'Updated Title' };
      mockDocumentsRepository.findById.mockResolvedValue(mockDoc);
      mockDocumentsRepository.update.mockResolvedValue(updated);

      const result = await service.update('ws-1', 'doc-1', { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
    });

    it('should throw NotFoundException if document not found during update', async () => {
      mockDocumentsRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('ws-1', 'doc-999', { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete the document when the requesting user is the creator', async () => {
      mockDocumentsRepository.findById.mockResolvedValue(mockDoc);
      mockDocumentsRepository.delete.mockResolvedValue(undefined);

      await expect(service.remove('ws-1', 'doc-1', 'user-1')).resolves.not.toThrow();
      expect(mockDocumentsRepository.delete).toHaveBeenCalledWith('doc-1');
    });

    it('should throw ForbiddenException if requesting user is not the creator', async () => {
      mockDocumentsRepository.findById.mockResolvedValue(mockDoc);

      await expect(service.remove('ws-1', 'doc-1', 'other-user')).rejects.toThrow(ForbiddenException);
      expect(mockDocumentsRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if document does not exist', async () => {
      mockDocumentsRepository.findById.mockResolvedValue(null);

      await expect(service.remove('ws-1', 'doc-999', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
