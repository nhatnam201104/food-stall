import { query } from 'express-validator';

export const touristTourListValidation = [
  query('search').optional().trim().isLength({ max: 120 }).withMessage('Search term is too long'),
];
