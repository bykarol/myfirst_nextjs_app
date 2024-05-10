'use server';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Validating the data received
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});
// Omitting id because its going to be generate in the database
const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  // Converting amount in cents to avoid js floating-point erros when storing in the db
  const amountInCents = amount * 100;
  // Creating the date wih the format YYYY-MM-DD
  const date = new Date().toISOString().split('T')[0];

  // inserting the data in the database
  await sql`
  INSERT INTO invoices (customer_id, amount, status, date)
  VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
`;

  // refreshing the cache with the new info
  revalidatePath('/dashboard/invoices');
  // redirecting to invoices page
  redirect('/dashboard/invoices');
}