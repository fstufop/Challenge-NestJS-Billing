import { Test, TestingModule } from '@nestjs/testing';
import { FileApiController } from './file-api.controller';
import { FileApiService } from './file-api.service';
import { S3Service } from '../../shared/storage/s3.service';
describe('FileApiController', () => {
  let controller: FileApiController;
  let fileApiService: FileApiService;
  let s3Service: S3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileApiController],
      providers: [
        {
          provide: FileApiService,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: S3Service,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue('s3://test/file.csv'),
          },
        },
      ],
    }).compile();

    controller = module.get<FileApiController>(FileApiController);
    fileApiService = module.get<FileApiService>(FileApiService);
    s3Service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call uploadFile and return a success message', async () => {
    const file = {
      originalname: 'test-file.csv',
      buffer: Buffer.from('dummy data'),
    } as Express.Multer.File;

    const response = await controller.uploadFile(file);

    expect(fileApiService.uploadFile).toHaveBeenCalledWith(file);
    expect(response).toEqual({
      message: `O arquivo ${file.originalname} foi enviado com sucesso`,
    });
  });

  it('should throw an error if the service fails', async () => {
    jest
      .spyOn(fileApiService, 'uploadFile')
      .mockRejectedValue(new Error('File upload failed'));

    const file = {
      originalname: 'test-file.csv',
      buffer: Buffer.from('dummy data'),
    } as Express.Multer.File;

    await expect(controller.uploadFile(file)).rejects.toThrow(
      'File upload failed',
    );
  });
});