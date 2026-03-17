import { query, param } from 'express-validator';

export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200')
    .toInt(),
];

export const uuidParamValidation = (paramName = 'id') => [
  param(paramName)
    .notEmpty().withMessage(`${paramName} is required`)
    .isUUID().withMessage(`${paramName} must be a valid UUID`),
];
