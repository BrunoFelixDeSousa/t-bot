import { TransactionRepository } from './transaction.repository';
import { UserRepository } from './user.repository';

export const userRepository = new UserRepository();
export const transactionRepository = new TransactionRepository();
