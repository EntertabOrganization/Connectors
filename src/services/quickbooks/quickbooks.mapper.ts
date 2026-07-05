export function normalizeQuickBooksCustomer(customer: Record<string, any>) {
  return {
    id: customer.Id,
    displayName: customer.DisplayName,
    givenName: customer.GivenName,
    familyName: customer.FamilyName,
    companyName: customer.CompanyName,
    email: customer.PrimaryEmailAddr?.Address,
    phone: customer.PrimaryPhone?.FreeFormNumber,
    active: customer.Active
  };
}

export function normalizeQuickBooksInvoice(invoice: Record<string, any>) {
  return {
    id: invoice.Id,
    customerId: invoice.CustomerRef?.value,
    totalAmount: invoice.TotalAmt,
    balance: invoice.Balance,
    dueDate: invoice.DueDate,
    privateNote: invoice.PrivateNote,
    txnDate: invoice.TxnDate
  };
}

export function normalizeQuickBooksItem(item: Record<string, any>) {
  return {
    id: item.Id,
    name: item.Name,
    description: item.Description,
    type: item.Type,
    active: item.Active,
    unitPrice: item.UnitPrice,
    incomeAccountRef: item.IncomeAccountRef?.value
  };
}
