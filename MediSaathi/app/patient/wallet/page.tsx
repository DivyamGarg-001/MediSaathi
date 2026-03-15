'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/protected-route'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  RefreshCw,
  Calendar,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

type Transaction = {
  id: string
  user_id: string
  transaction_type: 'expense' | 'income' | 'insurance_claim'
  category: string
  amount: number
  description: string | null
  date_occurred: string
  doctor_id: string | null
  hospital_id: string | null
  appointment_id: string | null
  receipt_url: string | null
  created_at: string
}

type WalletSummary = {
  totalExpenses: number
  totalIncome: number
  totalClaims: number
  netSpend: number
  byCategory: Record<string, number>
  monthlyTrend: { month: string; expenses: number; income: number }[]
  transactionCount: number
  recentTransactions: Transaction[]
}

const EXPENSE_CATEGORIES = [
  'Consultation', 'Lab Tests', 'Medicines', 'Surgery', 'Hospitalization',
  'Dental', 'Eye Care', 'Physiotherapy', 'Mental Health', 'Other'
]

const INCOME_CATEGORIES = ['Insurance Payout', 'Reimbursement', 'Refund', 'Other']

export default function HealthWalletPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<WalletSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addingTransaction, setAddingTransaction] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')

  // Form state
  const [formData, setFormData] = useState({
    transaction_type: 'expense' as 'expense' | 'income' | 'insurance_claim',
    category: '',
    amount: '',
    description: '',
    date_occurred: new Date().toISOString().split('T')[0],
  })

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [txRes, summaryRes] = await Promise.all([
        fetch(`/api/health-wallet?action=get-transactions&userId=${user.id}${filterType !== 'all' ? `&type=${filterType}` : ''}`),
        fetch(`/api/health-wallet?action=get-summary&userId=${user.id}`)
      ])
      const txData = await txRes.json()
      const summaryData = await summaryRes.json()

      if (txData.success) setTransactions(txData.data || [])
      if (summaryData.success) setSummary(summaryData.data)
    } catch {
      // Non-critical
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) loadData()
  }, [user, filterType])

  const handleAddTransaction = async () => {
    if (!user || !formData.category || !formData.amount) return
    setAddingTransaction(true)
    try {
      const response = await fetch('/api/health-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionData: {
            user_id: user.id,
            transaction_type: formData.transaction_type,
            category: formData.category,
            amount: parseFloat(formData.amount),
            description: formData.description || null,
            date_occurred: formData.date_occurred,
          }
        })
      })
      const result = await response.json()
      if (result.success) {
        setIsAddModalOpen(false)
        setFormData({
          transaction_type: 'expense',
          category: '',
          amount: '',
          description: '',
          date_occurred: new Date().toISOString().split('T')[0],
        })
        loadData()
      }
    } catch {
      // Handle error
    } finally {
      setAddingTransaction(false)
    }
  }

  const handleDelete = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/health-wallet?transactionId=${transactionId}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) loadData()
    } catch {
      // Handle error
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'expense': return <ArrowUpRight className="h-4 w-4 text-red-500" />
      case 'income': return <ArrowDownRight className="h-4 w-4 text-green-500" />
      case 'insurance_claim': return <ShieldCheck className="h-4 w-4 text-blue-500" />
      default: return <DollarSign className="h-4 w-4" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'expense': return <Badge variant="destructive" className="text-xs">Expense</Badge>
      case 'income': return <Badge className="bg-green-100 text-green-800 text-xs">Income</Badge>
      case 'insurance_claim': return <Badge className="bg-blue-100 text-blue-800 text-xs">Insurance</Badge>
      default: return <Badge variant="secondary" className="text-xs">{type}</Badge>
    }
  }

  const categories = formData.transaction_type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  return (
    <ProtectedRoute allowedUserTypes={['patient']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-green-50/50">
        {/* Header */}
        <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="container flex items-center gap-4 py-4">
            <Link href="/patient/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Health Wallet</h1>
              <p className="text-sm text-muted-foreground">Track medical expenses, income & insurance claims</p>
            </div>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Transaction
              </Button>
            </div>
          </div>
        </div>

        <div className="container py-6 space-y-6">
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-muted-foreground">Expenses</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    ${summary.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-muted-foreground">Income</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    ${summary.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="h-5 w-5 text-blue-500" />
                    <span className="text-sm text-muted-foreground">Insurance Claims</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    ${summary.totalClaims.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Net Spend</span>
                  </div>
                  <p className={`text-2xl font-bold ${summary.netSpend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${Math.abs(summary.netSpend).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Category Breakdown */}
          {summary && Object.keys(summary.byCategory).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expense Breakdown</CardTitle>
                <CardDescription>Spending by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(summary.byCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, amount]) => {
                      const percentage = summary.totalExpenses > 0 ? (amount / summary.totalExpenses) * 100 : 0
                      return (
                        <div key={category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{category}</span>
                            <span className="font-medium">${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monthly Trend */}
          {summary && summary.monthlyTrend.some(m => m.expenses > 0 || m.income > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Trend</CardTitle>
                <CardDescription>Last 6 months overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 gap-2">
                  {summary.monthlyTrend.map((month) => {
                    const maxVal = Math.max(...summary.monthlyTrend.map(m => Math.max(m.expenses, m.income)), 1)
                    const expenseHeight = (month.expenses / maxVal) * 100
                    return (
                      <div key={month.month} className="text-center">
                        <div className="h-24 flex items-end justify-center gap-1 mb-1">
                          <div
                            className="w-3 bg-red-300 rounded-t transition-all"
                            style={{ height: `${Math.max(expenseHeight, 2)}%` }}
                            title={`Expenses: $${month.expenses}`}
                          />
                          <div
                            className="w-3 bg-green-300 rounded-t transition-all"
                            style={{ height: `${Math.max((month.income / maxVal) * 100, 2)}%` }}
                            title={`Income: $${month.income}`}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{month.month}</p>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-300 rounded" /> Expenses</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-300 rounded" /> Income/Claims</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transactions List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Transactions</CardTitle>
                  <CardDescription>{transactions.length} records</CardDescription>
                </div>
                <Tabs value={filterType} onValueChange={setFilterType}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="expense">Expenses</TabsTrigger>
                    <TabsTrigger value="income">Income</TabsTrigger>
                    <TabsTrigger value="insurance_claim">Claims</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-lg font-medium text-gray-600">No transactions yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Start tracking your medical expenses</p>
                  <Button className="mt-4" size="sm" onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add First Transaction
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                      {getTypeIcon(tx.transaction_type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{tx.category}</span>
                          {getTypeBadge(tx.transaction_type)}
                        </div>
                        {tx.description && (
                          <p className="text-xs text-muted-foreground truncate">{tx.description}</p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {new Date(tx.date_occurred).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${tx.transaction_type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                          {tx.transaction_type === 'expense' ? '-' : '+'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={() => handleDelete(tx.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Transaction Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
              <DialogDescription>Record a medical expense, income or insurance claim</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Transaction Type</Label>
                <Select
                  value={formData.transaction_type}
                  onValueChange={(val: 'expense' | 'income' | 'insurance_claim') =>
                    setFormData({ ...formData, transaction_type: val, category: '' })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income / Reimbursement</SelectItem>
                    <SelectItem value="insurance_claim">Insurance Claim</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date_occurred}
                  onChange={(e) => setFormData({ ...formData, date_occurred: e.target.value })}
                />
              </div>

              <div>
                <Label>Description (optional)</Label>
                <Input
                  placeholder="e.g., Blood test at City Lab"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleAddTransaction}
                disabled={addingTransaction || !formData.category || !formData.amount}
              >
                {addingTransaction ? (
                  <><RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Adding...</>
                ) : (
                  <><Plus className="h-4 w-4 mr-1" /> Add Transaction</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
