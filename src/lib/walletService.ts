import { supabase } from './supabase';
import type { DocWithId } from './types';

/**
 * Wallet Transaction types
 */
export interface WalletTransaction {
  id?: string;
  schoolId: string;
  userId: string;
  type: 'credit' | 'debit' | 'transfer';
  amount: number;
  description: string;
  reference?: string; // Payment intent ID or transaction reference
  balanceBefore?: number;
  balanceAfter?: number;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Parent Wallet
 */
export interface ParentWallet {
  id?: string;
  schoolId: string;
  parentId: string;
  balance: number;
  totalFunded: number;
  totalSpent: number;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Get or create parent wallet
 */
export const getOrCreateWallet = async (
  schoolId: string,
  parentId: string
): Promise<ParentWallet | null> => {
  try {
    const { data, error } = await supabase
      .from('parent_wallets')
      .select('*')
      .eq('school_id', schoolId)
      .eq('parent_id', parentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is expected
      throw error;
    }

    if (data) {
      return {
        id: data.id,
        schoolId: data.school_id,
        parentId: data.parent_id,
        balance: data.balance,
        totalFunded: data.total_funded,
        totalSpent: data.total_spent,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    // Create new wallet
    const { data: newWallet, error: createError } = await supabase
      .from('parent_wallets')
      .insert({
        school_id: schoolId,
        parent_id: parentId,
        balance: 0,
        total_funded: 0,
        total_spent: 0,
      })
      .select()
      .single();

    if (createError) throw createError;

    return {
      id: newWallet.id,
      schoolId: newWallet.school_id,
      parentId: newWallet.parent_id,
      balance: newWallet.balance,
      totalFunded: newWallet.total_funded,
      totalSpent: newWallet.total_spent,
      createdAt: newWallet.created_at,
    };
  } catch (error) {
    console.error('Error getting/creating wallet:', error);
    return null;
  }
};

/**
 * Get wallet balance
 */
export const getWalletBalance = async (
  schoolId: string,
  parentId: string
): Promise<number | null> => {
  try {
    const wallet = await getOrCreateWallet(schoolId, parentId);
    return wallet?.balance ?? null;
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return null;
  }
};

/**
 * Fund wallet via payment
 */
export const fundWallet = async (
  schoolId: string,
  parentId: string,
  amount: number,
  paymentIntentId: string,
  paymentMethod: string = 'card'
): Promise<{ success: boolean; wallet?: ParentWallet; error?: string }> => {
  try {
    // Get or create wallet
    const wallet = await getOrCreateWallet(schoolId, parentId);
    if (!wallet) {
      throw new Error('Failed to get or create wallet');
    }

    // Update wallet balance
    const newBalance = wallet.balance + amount;
    const newTotalFunded = wallet.totalFunded + amount;

    const { data: updatedWallet, error: updateError } = await supabase
      .from('parent_wallets')
      .update({
        balance: newBalance,
        total_funded: newTotalFunded,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Record transaction
    const { error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert({
        school_id: schoolId,
        user_id: parentId,
        type: 'credit',
        amount: amount,
        description: `Wallet funding via ${paymentMethod}`,
        reference: paymentIntentId,
        balance_before: wallet.balance,
        balance_after: newBalance,
      });

    if (transactionError) throw transactionError;

    return {
      success: true,
      wallet: {
        id: updatedWallet.id,
        schoolId: updatedWallet.school_id,
        parentId: updatedWallet.parent_id,
        balance: updatedWallet.balance,
        totalFunded: updatedWallet.total_funded,
        totalSpent: updatedWallet.total_spent,
        createdAt: updatedWallet.created_at,
        updatedAt: updatedWallet.updated_at,
      },
    };
  } catch (error) {
    console.error('Error funding wallet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fund wallet',
    };
  }
};

/**
 * Use wallet balance to pay fee
 */
export const useWalletForPayment = async (
  schoolId: string,
  parentId: string,
  studentId: string,
  amount: number,
  feeDescription: string,
  invoiceId?: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> => {
  try {
    // Get wallet
    const wallet = await getOrCreateWallet(schoolId, parentId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Check sufficient balance
    if (wallet.balance < amount) {
      return {
        success: false,
        error: `Insufficient balance. You have ₦${wallet.balance.toLocaleString()} but need ₦${amount.toLocaleString()}`,
      };
    }

    // Deduct from wallet
    const newBalance = wallet.balance - amount;
    const newTotalSpent = wallet.totalSpent + amount;

    const { error: updateError } = await supabase
      .from('parent_wallets')
      .update({
        balance: newBalance,
        total_spent: newTotalSpent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id);

    if (updateError) throw updateError;

    // Record transaction
    const { error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert({
        school_id: schoolId,
        user_id: parentId,
        type: 'debit',
        amount: amount,
        description: feeDescription,
        reference: invoiceId,
        balance_before: wallet.balance,
        balance_after: newBalance,
      });

    if (transactionError) throw transactionError;

    // Record financial transaction
    const { error: financialError } = await supabase
      .from('financial_transactions')
      .insert({
        school_id: schoolId,
        student_id: studentId,
        type: 'fee-payment',
        amount: amount,
        reference: `WALLET-${invoiceId || Date.now()}`,
        payment_method: 'wallet',
        description: feeDescription,
        status: 'completed',
      });

    if (financialError) throw financialError;

    // Update invoice if provided
    if (invoiceId) {
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString(),
          payment_method: 'wallet',
          transaction_ref: `WALLET-${invoiceId}`,
        })
        .eq('id', invoiceId)
        .eq('school_id', schoolId);

      if (invoiceError) throw invoiceError;
    }

    return {
      success: true,
      newBalance: newBalance,
    };
  } catch (error) {
    console.error('Error using wallet for payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment failed',
    };
  }
};

/**
 * Get wallet transaction history
 */
export const getWalletTransactions = async (
  schoolId: string,
  userId: string,
  limit: number = 50
): Promise<DocWithId<WalletTransaction>[]> => {
  try {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('school_id', schoolId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(t => ({
      id: t.id,
      schoolId: t.school_id,
      userId: t.user_id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      reference: t.reference,
      balanceBefore: t.balance_before,
      balanceAfter: t.balance_after,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    })) as DocWithId<WalletTransaction>[];
  } catch (error) {
    console.error('Error getting wallet transactions:', error);
    return [];
  }
};

/**
 * Transfer funds between wallets (admin feature)
 */
export const transferWalletFunds = async (
  schoolId: string,
  fromParentId: string,
  toParentId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get both wallets
    const fromWallet = await getOrCreateWallet(schoolId, fromParentId);
    const toWallet = await getOrCreateWallet(schoolId, toParentId);

    if (!fromWallet || !toWallet) {
      throw new Error('One or both wallets not found');
    }

    // Check balance
    if (fromWallet.balance < amount) {
      throw new Error('Insufficient balance for transfer');
    }

    // Deduct from source
    const { error: deductError } = await supabase
      .from('parent_wallets')
      .update({
        balance: fromWallet.balance - amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fromWallet.id);

    if (deductError) throw deductError;

    // Add to destination
    const { error: addError } = await supabase
      .from('parent_wallets')
      .update({
        balance: toWallet.balance + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', toWallet.id);

    if (addError) throw addError;

    // Record transactions
    const refId = `TRANSFER-${Date.now()}`;

    await supabase.from('wallet_transactions').insert({
      school_id: schoolId,
      user_id: fromParentId,
      type: 'transfer',
      amount: amount,
      description: `Transfer: ${reason}`,
      reference: refId,
      balance_before: fromWallet.balance,
      balance_after: fromWallet.balance - amount,
    });

    await supabase.from('wallet_transactions').insert({
      school_id: schoolId,
      user_id: toParentId,
      type: 'transfer',
      amount: amount,
      description: `Received: ${reason}`,
      reference: refId,
      balance_before: toWallet.balance,
      balance_after: toWallet.balance + amount,
    });

    return { success: true };
  } catch (error) {
    console.error('Error transferring funds:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transfer failed',
    };
  }
};
