import type { Contrato, Pagamento } from '../types';

/** Merge against the latest state; another completed payment must not be lost. */
export const mergeContractPayment = (
    contracts: Contrato[], contractId: number, savedPayment: Pagamento,
): Contrato[] => contracts.map(contract => contract.id !== contractId ? contract : {
    ...contract,
    pagamentos: (contract.pagamentos || []).map(payment => payment.id === savedPayment.id
        ? { ...payment, ...savedPayment } : payment),
});

export const removeContractPayment = (
    contracts: Contrato[], contractId: number, paymentId: number,
): Contrato[] => contracts.map(contract => contract.id !== contractId ? contract : {
    ...contract, pagamentos: (contract.pagamentos || []).filter(payment => payment.id !== paymentId),
});
