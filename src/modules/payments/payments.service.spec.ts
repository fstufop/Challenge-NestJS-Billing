import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './repositories/payments.repository';
import { BankslipGeneratorProvider } from './providers/bankslip-generator.provider';
import { EmailProvider } from './providers/email-provider';
import { BankslipValidator } from './validators/bankslip.validator';
import { PaymentStatus, PaymentEntity } from './entities/payment.entity';
import { UpdateResult } from 'typeorm';

describe('PaymentsService', () => {
  let paymentsService: PaymentsService;
  let paymentsRepository: PaymentsRepository;
  let bankslipGenerator: BankslipGeneratorProvider;
  let emailProvider: EmailProvider;
  let bankslipValidator: BankslipValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PaymentsRepository,
          useValue: {
            findByDebtId: jest.fn(),
            createPayment: jest.fn(),
            updateStatus: jest.fn(),
            updateBarcode: jest.fn(),
            updateValidationError: jest.fn(),
          },
        },
        {
          provide: BankslipGeneratorProvider,
          useValue: {
            generateBankslip: jest.fn().mockResolvedValue('12345678901234567890123456789012345678901234'),
          },
        },
        {
          provide: EmailProvider,
          useValue: {
            sendBankslipEmail: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: BankslipValidator,
          useValue: {
            validate: jest.fn().mockReturnValue([]),
          },
        },
      ],
    }).compile();

    paymentsService = module.get<PaymentsService>(PaymentsService);
    paymentsRepository = module.get<PaymentsRepository>(PaymentsRepository);
    bankslipGenerator = module.get<BankslipGeneratorProvider>(BankslipGeneratorProvider);
    emailProvider = module.get<EmailProvider>(EmailProvider);
    bankslipValidator = module.get<BankslipValidator>(BankslipValidator);
  });

  it('should be defined', () => {
    expect(paymentsService).toBeDefined();
  });

  describe('processPaymentMessage', () => {
    it('should process and create a new payment if it does not exist', async () => {
      const mockData = {
        debtId: '123',
        rawData: JSON.stringify({
          debtId: '123',
          name: 'John Doe',
          email: 'john@example.com',
          governmentId: '987654321',
          debtAmount: '2500.50',
          debtDueDate: '2025-04-01',
        }),
        fileId: 'abc-123',
      };

      jest.spyOn(paymentsRepository, 'findByDebtId').mockResolvedValue(null);
      jest.spyOn(paymentsRepository, 'createPayment').mockResolvedValue({} as PaymentEntity);
      jest.spyOn(paymentsRepository, 'updateStatus').mockResolvedValue({ affected: 1 } as UpdateResult);

      await paymentsService.processPaymentMessage(mockData);

      expect(paymentsRepository.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          debtId: '123',
          name: 'John Doe',
          email: 'john@example.com',
          debtAmount: 2500.50,
        })
      );
    });

    it('should validate payment data and update error message if validation fails', async () => {
      const mockData = {
        debtId: '456',
        rawData: JSON.stringify({
          debtId: '456',
          name: '',
          email: 'invalid-email',
          governmentId: '123',
          debtAmount: '-10',
          debtDueDate: 'invalid-date',
        }),
        fileId: 'xyz-789',
      };

      jest.spyOn(paymentsRepository, 'findByDebtId').mockResolvedValue(null);
      jest.spyOn(paymentsRepository, 'createPayment').mockResolvedValue({} as PaymentEntity);
      jest.spyOn(bankslipValidator, 'validate').mockReturnValue(['Invalid email', 'Negative debt amount']);
      jest.spyOn(paymentsRepository, 'updateValidationError').mockResolvedValue({ affected: 1 } as UpdateResult);

      await paymentsService.processPaymentMessage(mockData);

      expect(paymentsRepository.updateValidationError).toHaveBeenCalledWith(
        '456',
        'Invalid email; Negative debt amount'
      );
    });
  });

  describe('generateBankslip', () => {
    it('should generate a bankslip and update status', async () => {
      const debtId = '789';
      jest.spyOn(paymentsRepository, 'updateStatus').mockResolvedValue({ affected: 1 } as UpdateResult);
      jest.spyOn(bankslipGenerator, 'generateBankslip').mockResolvedValue('1234567890');
      jest.spyOn(paymentsRepository, 'updateBarcode').mockResolvedValue({ affected: 1 } as UpdateResult);
      jest.spyOn(paymentsService, 'sendEmail').mockResolvedValue(undefined);

      await paymentsService.generateBankslip(debtId);

      expect(paymentsRepository.updateStatus).toHaveBeenCalledWith(debtId, PaymentStatus.PROCESSING);
      expect(bankslipGenerator.generateBankslip).toHaveBeenCalled();
      expect(paymentsRepository.updateBarcode).toHaveBeenCalledWith(debtId, '1234567890');
      expect(paymentsService.sendEmail).toHaveBeenCalledWith(debtId);
    });

    it('should update status to GENERATE_FAILED if bankslip generation fails', async () => {
      const debtId = '101';
      jest.spyOn(paymentsRepository, 'updateStatus').mockResolvedValue({ affected: 1 } as UpdateResult);
      jest.spyOn(bankslipGenerator, 'generateBankslip').mockRejectedValue(new Error('Generation error'));
      jest.spyOn(paymentsRepository, 'updateStatus').mockResolvedValue({ affected: 1 } as UpdateResult);

      await paymentsService.generateBankslip(debtId);

      expect(paymentsRepository.updateStatus).toHaveBeenCalledWith(debtId, PaymentStatus.GENERATE_FAILED);
    });
  });

  describe('sendEmail', () => {
    it('should send email and update status to SENT', async () => {
      const debtId = '111';
      const mockPayment: PaymentEntity = {
        debtId,
        email: 'test@example.com',
      } as PaymentEntity;

      jest.spyOn(paymentsRepository, 'findByDebtId').mockResolvedValue(mockPayment);
      jest.spyOn(emailProvider, 'sendBankslipEmail').mockResolvedValue(true);
      jest.spyOn(paymentsRepository, 'updateStatus').mockResolvedValue({ affected: 1 } as UpdateResult);

      await paymentsService.sendEmail(debtId);

      expect(emailProvider.sendBankslipEmail).toHaveBeenCalledWith('test@example.com');
      expect(paymentsRepository.updateStatus).toHaveBeenCalledWith(debtId, PaymentStatus.SENT);
    });

    it('should update status to SEND_FAILED if email sending fails', async () => {
      const debtId = '222';
      const mockPayment: PaymentEntity = {
        debtId,
        email: 'fail@example.com',
      } as PaymentEntity;

      jest.spyOn(paymentsRepository, 'findByDebtId').mockResolvedValue(mockPayment);
      jest.spyOn(emailProvider, 'sendBankslipEmail').mockResolvedValue(false);
      jest.spyOn(paymentsRepository, 'updateStatus').mockResolvedValue({ affected: 1 } as UpdateResult);

      await paymentsService.sendEmail(debtId);

      expect(paymentsRepository.updateStatus).toHaveBeenCalledWith(debtId, PaymentStatus.SEND_FAILED);
    });

    it('should log warning if payment is not found', async () => {
      const debtId = '333';
      jest.spyOn(paymentsRepository, 'findByDebtId').mockResolvedValue(null);

      await paymentsService.sendEmail(debtId);

      expect(paymentsRepository.updateStatus).not.toHaveBeenCalled();
    });
  });
});