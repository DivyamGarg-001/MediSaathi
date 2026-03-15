import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type HealthWallet = Database['public']['Tables']['health_wallet']['Row']
type HealthWalletInsert = Database['public']['Tables']['health_wallet']['Insert']
type HealthWalletUpdate = Database['public']['Tables']['health_wallet']['Update']

export class HealthWalletService {
  // Get all transactions for a user with optional filters
  static async getUserTransactions(
    userId: string,
    type?: string,
    startDate?: string,
    endDate?: string
  ) {
    try {
      let query = supabase
        .from('health_wallet')
        .select('*')
        .eq('user_id', userId)

      if (type) {
        query = query.eq('transaction_type', type)
      }
      if (startDate) {
        query = query.gte('date_occurred', startDate)
      }
      if (endDate) {
        query = query.lte('date_occurred', endDate)
      }

      const { data, error } = await query.order('date_occurred', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Add a new transaction
  static async addTransaction(transactionData: HealthWalletInsert) {
    try {
      const { data, error } = await supabase
        .from('health_wallet')
        .insert(transactionData)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update a transaction
  static async updateTransaction(transactionId: string, updates: HealthWalletUpdate) {
    try {
      const { data, error } = await supabase
        .from('health_wallet')
        .update(updates)
        .eq('id', transactionId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Delete a transaction
  static async deleteTransaction(transactionId: string) {
    try {
      const { error } = await supabase
        .from('health_wallet')
        .delete()
        .eq('id', transactionId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  // Get wallet summary (balance, totals by type)
  static async getWalletSummary(userId: string, months: number = 12) {
    try {
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - months)

      const { data, error } = await supabase
        .from('health_wallet')
        .select('*')
        .eq('user_id', userId)
        .gte('date_occurred', startDate.toISOString().split('T')[0])
        .order('date_occurred', { ascending: false })

      if (error) throw error

      const transactions = data || []

      const totalExpenses = transactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const totalIncome = transactions
        .filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const totalClaims = transactions
        .filter(t => t.transaction_type === 'insurance_claim')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      // Group by category
      const byCategory: Record<string, number> = {}
      transactions
        .filter(t => t.transaction_type === 'expense')
        .forEach(t => {
          byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount)
        })

      // Monthly trend (last 6 months)
      const monthlyTrend: { month: string; expenses: number; income: number }[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

        const monthExpenses = transactions
          .filter(t => t.transaction_type === 'expense' && t.date_occurred.startsWith(monthKey))
          .reduce((sum, t) => sum + Number(t.amount), 0)

        const monthIncome = transactions
          .filter(t => t.transaction_type !== 'expense' && t.date_occurred.startsWith(monthKey))
          .reduce((sum, t) => sum + Number(t.amount), 0)

        monthlyTrend.push({ month: monthLabel, expenses: monthExpenses, income: monthIncome })
      }

      return {
        data: {
          totalExpenses,
          totalIncome,
          totalClaims,
          netSpend: totalExpenses - totalIncome - totalClaims,
          byCategory,
          monthlyTrend,
          transactionCount: transactions.length,
          recentTransactions: transactions.slice(0, 5)
        },
        error: null
      }
    } catch (error) {
      return { data: null, error }
    }
  }
}
