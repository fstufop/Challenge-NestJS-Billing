import { Test, TestingModule } from '@nestjs/testing';
import { FileProcessingController } from './file-processing.controller';

describe('FileProcessingController', () => {
  let controller: FileProcessingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileProcessingController],
    }).compile();

    controller = module.get<FileProcessingController>(FileProcessingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
