import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const categoryRepository = getRepository(Category);
    const transactionRepository = getRepository(Transaction);

    const checkCategoryExists = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!checkCategoryExists) {
      const createCategory = await categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(createCategory);
    }

    if (['income', 'outcome'].includes(type)) {
      const repo = new TransactionsRepository();
      const { total } = await repo.getBalance();

      if (type === 'outcome' && total < value)
        throw new AppError('You do not have enough balance', 400);

      const categoryId = await categoryRepository.findOne({
        where: { title: category },
      });

      const transaction = transactionRepository.create({
        title,
        value,
        type,
        category_id: categoryId.id,
      });

      await transactionRepository.save(transaction);

      return transaction;
    }

    throw new AppError('only income or outcome are valid operations', 400);
  }
}

export default CreateTransactionService;
