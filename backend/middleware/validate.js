import { z } from 'zod';

export const signupSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(6),
  password: z.string().min(8),
  confirmPassword: z.string().min(8)
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword']
});

export function validate(schema) {
  return async (req, res, next) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (err) {
      res.status(400).json({ errors: err.errors });
    }
  };
}
