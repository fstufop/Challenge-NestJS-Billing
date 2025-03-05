import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from '../payments.service';
import { ConfigService } from '@nestjs/config';
import { KafkaMessage } from 'kafkajs';
import { PaymentsConsumer } from './payment.consumer';

describe('PaymentsConsumer', () => {
  let paymentsConsumer: PaymentsConsumer;
  let paymentsServiceMock: jest.Mocked<PaymentsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsConsumer,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('localhost:9092') },
        },
        {
          provide: PaymentsService,
          useValue: {
            processPaymentMessage: jest.fn(),
          },
        },
      ],
    }).compile();

    paymentsConsumer = module.get<PaymentsConsumer>(PaymentsConsumer);
    paymentsServiceMock = module.get<PaymentsService>(
      PaymentsService,
    ) as jest.Mocked<PaymentsService>;
  });

  it('should be defined', () => {
    expect(paymentsConsumer).toBeDefined();
  });

  describe('processMessage', () => {
    it('should call processPaymentMessage if message is valid', async () => {
      const message: KafkaMessage = {
        value: Buffer.from(
          JSON.stringify({
            id: 'test-id',
            fileId: 'file-id',
            rawData: JSON.stringify({
              debtId: '1234',
              name: 'John Doe',
              email: 'johndoe@example.com',
            }),
          }),
        ),
      } as any;

      await paymentsConsumer['processMessage'](message);

      expect(paymentsServiceMock.processPaymentMessage).toHaveBeenCalledWith({
        id: 'test-id',
        fileId: 'file-id',
        rawData: {
          debtId: '1234',
          name: 'John Doe',
          email: 'johndoe@example.com',
        },
      });
    });

    it('should log error and not call processPaymentMessage if message is malformed', async () => {
      const malformedMessage: KafkaMessage = {
        value: Buffer.from('{ invalid json }'),
      } as any;

      const loggerErrorSpy = jest
        .spyOn(paymentsConsumer['logger'], 'error')
        .mockImplementation();

      await paymentsConsumer['processMessage'](malformedMessage);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Erro ao decodificar mensagem Kafka'),
      );
      expect(paymentsServiceMock.processPaymentMessage).not.toHaveBeenCalled();
    });

    it('should not process message if value is null', async () => {
      const emptyMessage: KafkaMessage = {
        value: null,
      } as any;

      await paymentsConsumer['processMessage'](emptyMessage);

      expect(paymentsServiceMock.processPaymentMessage).not.toHaveBeenCalled();
    });
  });

  describe('parseKafkaMessage', () => {
    it('should correctly parse valid Kafka messages', () => {
      const kafkaMessage: KafkaMessage = {
        value: Buffer.from(
          JSON.stringify({
            id: 'test-id',
            fileId: 'file-id',
            rawData: JSON.stringify({
              debtId: '1234',
              name: 'John Doe',
              email: 'johndoe@example.com',
            }),
          }),
        ),
      } as any;

      const parsed = paymentsConsumer['parseKafkaMessage'](kafkaMessage);

      expect(parsed).toEqual({
        id: 'test-id',
        fileId: 'file-id',
        rawData: {
          debtId: '1234',
          name: 'John Doe',
          email: 'johndoe@example.com',
        },
      });
    });

    it('should return null for invalid messages', () => {
      const invalidMessage: KafkaMessage = {
        value: Buffer.from('{ invalid json }'),
      } as any;

      const parsed = paymentsConsumer['parseKafkaMessage'](invalidMessage);

      expect(parsed).toBeNull();
    });

    it('should return null if message has no value', () => {
      const emptyMessage: KafkaMessage = {
        value: null,
      } as any;

      const parsed = paymentsConsumer['parseKafkaMessage'](emptyMessage);

      expect(parsed).toBeNull();
    });
  });
});