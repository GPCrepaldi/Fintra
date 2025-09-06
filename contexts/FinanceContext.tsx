import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: 'expense' | 'income'; // expense = gasto, income = ganho
  type: 'credit' | 'debit'; // Para gastos: credit/debit, para ganhos sempre será 'income'
  isRecurring?: boolean;
  dueDay?: number;
  recurringMonths?: number; // Número de meses que a transação se repete
  startMonth?: number; // Mês de início da transação (1-12)
  startYear?: number; // Ano de início da transação
}

interface Goal {
  id: string;
  name: string;
  totalTarget: number; // Valor total da meta
  monthlyTarget: number; // Valor máximo a ser adicionado por mês
  currentAmount: number; // Valor atual acumulado na meta
  createdAt: Date;
  isActive: boolean;
}

interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  month: number;
  year: number;
  isComplete: boolean; // true se conseguiu adicionar o valor total, false se foi parcial
  date: Date;
}

// Manter interface Expense para compatibilidade
interface Expense extends Transaction {}

interface FinanceContextData {
  salary: number;
  setSalary: (value: number) => Promise<void>;
  transactions: Transaction[];
  expenses: Expense[]; // Manter para compatibilidade
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>; // Manter para compatibilidade
  updateTransaction: (transaction: Transaction) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>; // Manter para compatibilidade
  deleteTransaction: (id: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>; // Manter para compatibilidade
  balance: number;
  getTransactionsByMonth: (month: number, year: number) => Transaction[];
  getExpensesByMonth: (month: number, year: number) => Expense[]; // Manter para compatibilidade
  currentMonth: number;
  currentYear: number;
  setCurrentMonth: (month: number) => void;
  setCurrentYear: (year: number) => void;
  // Funções de metas
  goals: Goal[];
  goalContributions: GoalContribution[];
  goalContributionDay: number; // Dia do mês para adicionar valores às metas (1-31)
  setGoalContributionDay: (day: number) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'currentAmount' | 'createdAt'>) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  processMonthlyGoalContributions: (month: number, year: number) => Promise<void>;
  getGoalContributionsByMonth: (month: number, year: number) => GoalContribution[];
  getAvailableBalance: (month: number, year: number) => number;
}

const FinanceContext = createContext<FinanceContextData>({} as FinanceContextData);

export const useFinance = () => useContext(FinanceContext);

interface FinanceProviderProps {
  children: ReactNode;
}

export function FinanceProvider({ children }: FinanceProviderProps) {
  const [salary, setSalaryState] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalContributions, setGoalContributions] = useState<GoalContribution[]>([]);
  const [goalContributionDay, setGoalContributionDayState] = useState<number>(1); // Padrão: dia 1

  // Manter expenses para compatibilidade
  const expenses = transactions.filter(t => t.category === 'expense');

  // Carregar dados do AsyncStorage ao iniciar
  useEffect(() => {
    async function loadStoredData() {
      try {
        const storedSalary = await AsyncStorage.getItem('@Fintra:salary');
        const storedTransactions = await AsyncStorage.getItem('@Fintra:transactions');
        const storedExpenses = await AsyncStorage.getItem('@Fintra:expenses'); // Para migração
        const storedGoals = await AsyncStorage.getItem('@Fintra:goals');
        const storedGoalContributions = await AsyncStorage.getItem('@Fintra:goalContributions');
        const storedGoalContributionDay = await AsyncStorage.getItem('@Fintra:goalContributionDay');

        if (storedSalary) {
          setSalaryState(Number(storedSalary));
        }

        if (storedTransactions) {
          setTransactions(JSON.parse(storedTransactions));
        } else if (storedExpenses) {
          // Migrar dados antigos de expenses para transactions
          const oldExpenses = JSON.parse(storedExpenses);
          const migratedTransactions = oldExpenses.map((expense: any) => ({
            ...expense,
            category: 'expense'
          }));
          setTransactions(migratedTransactions);
          await AsyncStorage.setItem('@Fintra:transactions', JSON.stringify(migratedTransactions));
        }
        
        if (storedGoals) {
          const parsedGoals = JSON.parse(storedGoals).map((g: any) => ({
            ...g,
            createdAt: new Date(g.createdAt)
          }));
          setGoals(parsedGoals);
        }
        
        if (storedGoalContributions) {
          const parsedContributions = JSON.parse(storedGoalContributions).map((c: any) => ({
            ...c,
            date: new Date(c.date)
          }));
          setGoalContributions(parsedContributions);
        }
        
        if (storedGoalContributionDay) {
          setGoalContributionDayState(Number(storedGoalContributionDay));
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    }

    loadStoredData();
  }, []);

  // Função para verificar se uma transação deve aparecer em um determinado mês/ano
  const isTransactionVisibleInMonth = (transaction: Transaction, month: number, year: number) => {
    const transactionDate = new Date(transaction.date);
    const transactionMonth = transactionDate.getMonth() + 1; // 1-12
    const transactionYear = transactionDate.getFullYear();
    
    // Para ganhos, sempre aparecem no mês em que foram cadastrados
    if (transaction.category === 'income') {
      return transactionMonth === month && transactionYear === year;
    }
    
    // Para gastos no débito, só aparecem no mês em que foram cadastrados
    if (transaction.type === 'debit') {
      return transactionMonth === month && transactionYear === year;
    }
    
    // Para gastos de crédito não recorrentes, só aparecem no mês em que foram cadastrados
    if (transaction.type === 'credit' && !transaction.isRecurring) {
      return transactionMonth === month && transactionYear === year;
    }
    
    // Para gastos de crédito recorrentes
    if (transaction.type === 'credit' && transaction.isRecurring) {
      const startMonth = transaction.startMonth || transactionMonth;
      const startYear = transaction.startYear || transactionYear;
      const recurringMonths = transaction.recurringMonths || 1;
      
      // Calcular o número total de meses desde o início
      const startTotalMonths = (startYear * 12) + startMonth;
      const targetTotalMonths = (year * 12) + month;
      const monthDifference = targetTotalMonths - startTotalMonths;
      
      // O gasto deve aparecer se estiver dentro do período de recorrência
      return monthDifference >= 0 && monthDifference < recurringMonths;
    }
    
    return false;
  };

  // Função para verificar se uma despesa deve aparecer em um determinado mês/ano (compatibilidade)
  const isExpenseVisibleInMonth = (expense: Expense, month: number, year: number) => {
    return isTransactionVisibleInMonth(expense, month, year);
    const expenseDate = new Date(expense.date);
    const expenseMonth = expenseDate.getMonth() + 1; // 1-12
    const expenseYear = expenseDate.getFullYear();
    
    // Para gastos no débito, só aparecem no mês em que foram cadastrados
    if (expense.type === 'debit') {
      return expenseMonth === month && expenseYear === year;
    }
    
    // Para gastos de crédito não recorrentes, só aparecem no mês em que foram cadastrados
    if (expense.type === 'credit' && !expense.isRecurring) {
      return expenseMonth === month && expenseYear === year;
    }
    
    // Para gastos de crédito recorrentes
    if (expense.type === 'credit' && expense.isRecurring) {
      const startMonth = expense.startMonth || expenseMonth;
      const startYear = expense.startYear || expenseYear;
      const recurringMonths = expense.recurringMonths || 1;
      
      // Calcular o número total de meses desde o início
      const startTotalMonths = (startYear * 12) + startMonth;
      const targetTotalMonths = (year * 12) + month;
      const monthDifference = targetTotalMonths - startTotalMonths;
      
      // O gasto deve aparecer se estiver dentro do período de recorrência
      return monthDifference >= 0 && monthDifference < recurringMonths;
    }
    
    return false;
  };

  // Função para obter transações de um mês específico
  const getTransactionsByMonth = (month: number, year: number) => {
    return transactions.filter(transaction => isTransactionVisibleInMonth(transaction, month, year));
  };

  // Função para obter gastos de um mês específico (compatibilidade)
  const getExpensesByMonth = (month: number, year: number) => {
    return expenses.filter(expense => isExpenseVisibleInMonth(expense, month, year));
  };

  // Calcular saldo disponível (salário + ganhos - gastos do mês atual)
  useEffect(() => {
    const currentMonthTransactions = getTransactionsByMonth(currentMonth, currentYear);
    
    const totalExpenses = currentMonthTransactions
      .filter(t => t.category === 'expense')
      .reduce((total, expense) => total + expense.amount, 0);
    
    const totalIncome = currentMonthTransactions
      .filter(t => t.category === 'income')
      .reduce((total, income) => total + income.amount, 0);
    
    setBalance(salary + totalIncome - totalExpenses);
  }, [salary, transactions, currentMonth, currentYear]);

  // Processar contribuições mensais automaticamente
  useEffect(() => {
    const processContributions = async () => {
      // Só processar se for o mês atual e houver metas ativas
      const now = new Date();
      const isCurrentMonth = currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear();
      
      if (isCurrentMonth && goals.some(g => g.isActive)) {
        // Verificar se já processou este mês
        const existingContributions = goalContributions.filter(
          c => c.month === currentMonth && c.year === currentYear
        );
        
        // Se não há contribuições para este mês e há saldo disponível, processar
        if (existingContributions.length === 0) {
          const availableBalance = getAvailableBalance(currentMonth, currentYear);
          if (availableBalance > 0) {
            await processMonthlyGoalContributions(currentMonth, currentYear);
          }
        }
      }
    };
    
    // Aguardar um pouco para garantir que todos os dados foram carregados
    const timer = setTimeout(processContributions, 1000);
    return () => clearTimeout(timer);
  }, [transactions, goals, currentMonth, currentYear, salary]);

  // Função para definir o salário
  const setSalary = async (value: number) => {
    try {
      await AsyncStorage.setItem('@Fintra:salary', String(value));
      setSalaryState(value);
    } catch (error) {
      console.error('Erro ao salvar salário:', error);
    }
  };

  const setGoalContributionDay = async (day: number) => {
    try {
      if (day < 1 || day > 31) {
        throw new Error('Dia deve estar entre 1 e 31');
      }
      await AsyncStorage.setItem('@Fintra:goalContributionDay', String(day));
      setGoalContributionDayState(day);
    } catch (error) {
      console.error('Erro ao salvar dia de contribuição das metas:', error);
    }
  };

  // Função para adicionar uma nova transação
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const now = new Date();
      const newTransaction = {
        ...transaction,
        id: Date.now().toString(),
        startMonth: transaction.isRecurring ? (transaction.startMonth || now.getMonth() + 1) : undefined,
        startYear: transaction.isRecurring ? (transaction.startYear || now.getFullYear()) : undefined,
      };

      const updatedTransactions = [...transactions, newTransaction];
      await AsyncStorage.setItem('@Fintra:transactions', JSON.stringify(updatedTransactions));
      setTransactions(updatedTransactions);
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
    }
  };

  // Função para adicionar um novo gasto (compatibilidade)
  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    await addTransaction({ ...expense, category: 'expense' });
  };

  // Função para atualizar uma transação existente
  const updateTransaction = async (transaction: Transaction) => {
    try {
      const updatedTransactions = transactions.map(item => 
        item.id === transaction.id ? transaction : item
      );

      await AsyncStorage.setItem('@Fintra:transactions', JSON.stringify(updatedTransactions));
      setTransactions(updatedTransactions);
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
    }
  };

  // Função para atualizar um gasto existente (compatibilidade)
  const updateExpense = async (expense: Expense) => {
    await updateTransaction(expense);
  };

  // Função para excluir uma transação
  const deleteTransaction = async (id: string) => {
    try {
      console.log('FinanceContext - Excluindo transação com ID:', id);
      console.log('FinanceContext - Transactions antes:', transactions.length);
      
      // Converter o ID para string para garantir a comparação correta
      const stringId = String(id);
      const updatedTransactions = transactions.filter(transaction => String(transaction.id) !== stringId);
      
      console.log('FinanceContext - Transactions depois:', updatedTransactions.length);
      
      if (transactions.length === updatedTransactions.length) {
        console.error('Nenhuma transação foi removida. IDs não correspondem.');
        // Imprimir todos os IDs para debug
        transactions.forEach(transaction => console.log('ID disponível:', transaction.id, typeof transaction.id));
        console.log('ID a ser excluído:', id, typeof id);
        throw new Error('ID não encontrado');
      }
      
      // Garantir que o AsyncStorage seja atualizado antes de atualizar o estado
      await AsyncStorage.setItem('@Fintra:transactions', JSON.stringify(updatedTransactions));
      
      // Atualizar o estado com os novos dados
      setTransactions(updatedTransactions);
      
      return true; // Retornar true para indicar sucesso
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      throw error; // Propagar o erro para ser tratado no componente
    }
  };

  // Função para excluir um gasto (compatibilidade)
  const deleteExpense = async (id: string) => {
    await deleteTransaction(id);
  };

  // Funções de metas
  const addGoal = async (goal: Omit<Goal, 'id' | 'currentAmount' | 'createdAt'>) => {
    try {
      const newGoal: Goal = {
        ...goal,
        id: Date.now().toString(),
        currentAmount: 0,
        createdAt: new Date(),
      };

      const updatedGoals = [...goals, newGoal];
      await AsyncStorage.setItem('@Fintra:goals', JSON.stringify(updatedGoals));
      setGoals(updatedGoals);
    } catch (error) {
      console.error('Erro ao adicionar meta:', error);
    }
  };

  const updateGoal = async (goal: Goal) => {
    try {
      const updatedGoals = goals.map(item => 
        item.id === goal.id ? goal : item
      );

      await AsyncStorage.setItem('@Fintra:goals', JSON.stringify(updatedGoals));
      setGoals(updatedGoals);
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
    }
  };

  const deleteGoal = async (id: string) => {
    console.log('🔥 deleteGoal chamada com ID:', id);
    console.log('📊 Metas antes da exclusão:', goals.length);
    
    try {
      const updatedGoals = goals.filter(goal => goal.id !== id);
      const updatedContributions = goalContributions.filter(contribution => contribution.goalId !== id);
      
      console.log('📊 Metas após filtro:', updatedGoals.length);
      console.log('💾 Salvando no AsyncStorage...');
      
      await AsyncStorage.setItem('@Fintra:goals', JSON.stringify(updatedGoals));
      await AsyncStorage.setItem('@Fintra:goalContributions', JSON.stringify(updatedContributions));
      
      console.log('✅ AsyncStorage atualizado');
      console.log('🔄 Atualizando estados...');
      
      setGoals(updatedGoals);
      setGoalContributions(updatedContributions);
      
      console.log('✅ Estados atualizados - exclusão concluída');
    } catch (error) {
      console.error('❌ Erro ao excluir meta:', error);
    }
  };

  const processMonthlyGoalContributions = async (month: number, year: number) => {
    try {
      const activeGoals = goals.filter(goal => goal.isActive);
      const availableBalance = getAvailableBalance(month, year);
      
      let remainingBalance = availableBalance;
      const newContributions: GoalContribution[] = [];
      
      for (const goal of activeGoals) {
        // Verificar se já existe contribuição para este mês
        const existingContribution = goalContributions.find(
          c => c.goalId === goal.id && c.month === month && c.year === year
        );
        
        if (!existingContribution && remainingBalance > 0) {
          const contributionAmount = Math.min(goal.monthlyTarget, remainingBalance);
          
          const contribution: GoalContribution = {
            id: Date.now().toString() + goal.id,
            goalId: goal.id,
            amount: contributionAmount,
            month,
            year,
            isComplete: contributionAmount === goal.monthlyTarget,
            date: new Date(),
          };
          
          newContributions.push(contribution);
          remainingBalance -= contributionAmount;
          
          // Atualizar o valor atual da meta
          const updatedGoal = {
            ...goal,
            currentAmount: goal.currentAmount + contributionAmount
          };
          
          await updateGoal(updatedGoal);
        }
      }
      
      if (newContributions.length > 0) {
        const updatedContributions = [...goalContributions, ...newContributions];
        await AsyncStorage.setItem('@Fintra:goalContributions', JSON.stringify(updatedContributions));
        setGoalContributions(updatedContributions);
      }
    } catch (error) {
      console.error('Erro ao processar contribuições mensais:', error);
    }
  };

  const getGoalContributionsByMonth = (month: number, year: number) => {
    return goalContributions.filter(contribution => 
      contribution.month === month && contribution.year === year
    );
  };

  const getAvailableBalance = (month: number, year: number) => {
    const monthlyTransactions = getTransactionsByMonth(month, year);
    const monthlyContributions = getGoalContributionsByMonth(month, year);
    
    const totalExpenses = monthlyTransactions
      .filter(t => t.category === 'expense')
      .reduce((total, expense) => total + expense.amount, 0);
    
    const totalIncome = monthlyTransactions
      .filter(t => t.category === 'income')
      .reduce((total, income) => total + income.amount, 0);
    
    const totalGoalContributions = monthlyContributions
      .reduce((total, contribution) => total + contribution.amount, 0);
    
    return salary + totalIncome - totalExpenses - totalGoalContributions;
  };

  return (
    <FinanceContext.Provider
      value={{
        salary,
        setSalary,
        transactions,
        expenses,
        addTransaction,
        addExpense,
        updateTransaction,
        updateExpense,
        deleteTransaction,
        deleteExpense,
        balance,
        getTransactionsByMonth,
        getExpensesByMonth,
        currentMonth,
        currentYear,
        setCurrentMonth,
        setCurrentYear,
        goals,
        goalContributions,
        goalContributionDay,
        setGoalContributionDay,
        addGoal,
        updateGoal,
        deleteGoal,
        processMonthlyGoalContributions,
        getGoalContributionsByMonth,
        getAvailableBalance,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}