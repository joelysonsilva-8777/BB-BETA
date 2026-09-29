export type Sheet = 'profile' | 'notifications' | 'statement' | 'pix' | 'payments' | 'transfer' | 'card' | 'investments' | 'services' | 'support' | 'savings' | 'recharge';
export type Transaction = {
  id: string; name: string; detail: string; amount: number;
  day: 'Hoje' | 'Ontem'; kind: 'pix' | 'purchase' | 'bill' | 'income';
};

// Entirely fictional, local data. There is no connection to a bank account.
export const account = {
  firstName: 'João', fullName: 'João Costa', initials: 'JC',
  branch: '1234-5', number: '12345-6', balance: 485075,
  invoice: 124890, cardLimit: 1000000, cardLastDigits: '4829',
  savings: 250000, savingsTarget: 600000,
};

export const transactions: Transaction[] = [
  { id: '1', name: 'Mariana Lima', detail: 'Pix recebido', amount: 35000, day: 'Hoje', kind: 'pix' },
  { id: '2', name: 'Pão de Açúcar', detail: 'Compra no débito', amount: -18642, day: 'Hoje', kind: 'purchase' },
  { id: '3', name: 'Conta de energia', detail: 'Pagamento de boleto', amount: -14280, day: 'Ontem', kind: 'bill' },
  { id: '4', name: 'Lucas Santos', detail: 'Pix enviado', amount: -8500, day: 'Ontem', kind: 'pix' },
  { id: '5', name: 'Salário', detail: 'Crédito em conta', amount: 520000, day: 'Ontem', kind: 'income' },
];

export const invoiceItems = [
  { name: 'Supermercado', amount: 28642 }, { name: 'Assinatura digital', amount: 3990 },
  { name: 'Restaurante', amount: 12680 }, { name: 'Compra on-line', amount: 79578 },
];

export function currency(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

export function invoiceDate() {
  const now = new Date();
  const due = new Date(now.getFullYear(), now.getMonth() + (now.getDate() > 10 ? 1 : 0), 10);
  return due.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}
