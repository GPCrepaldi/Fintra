import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: Date;
  type: 'credit' | 'debit';
  isRecurring?: boolean;
  dueDay?: number;
  recurringMonths?: number; // Número de meses que o gasto se repete
  startMonth?: number; // Mês de início do gasto (1-12)
  startYear?: number; // Ano de início do gasto
}

interface FinanceContextData {
  salary: number;
  setSalary: (value: number) => Promise<void>;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  balance: number;
  getExpensesByMonth: (month: number, year: number) => Expense[];
  currentMonth: number;
  currentYear: number;
  setCurrentMonth: (month: number) => void;
  setCurrentYear: (year: number) => void;
}

const FinanceContext = createContext<FinanceContextData>({} as FinanceContextData);

export const useFinance = () => useContext(FinanceContext);

interface FinanceProviderProps {
  children: ReactNode;
}

export function FinanceProvider({ children }: FinanceProviderProps) {
  const [salary, setSalaryState] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balance, setBalance] = useState(0);
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

  // Carregar dados do AsyncStorage ao iniciar
  useEffect(() => {
    async function loadStoredData() {
      try {
        const storedSalary = await AsyncStorage.getItem('@Fintra:salary');
        const storedExpenses = await AsyncStorage.getItem('@Fintra:expenses');

        if (storedSalary) {
          setSalaryState(Number(storedSalary));
        }

        if (storedExpenses) {
          setExpenses(JSON.parse(storedExpenses));
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    }

    loadStoredData();
  }, []);

  // Função para verificar se uma despesa deve aparecer em um determinado mês/ano
  const isExpenseVisibleInMonth = (expense: Expense, month: number, year: number) => {
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

  // Função para obter gastos de um mês específico
  const getExpensesByMonth = (month: number, year: number) => {
    return expenses.filter(expense => isExpenseVisibleInMonth(expense, month, year));
  };

  // Calcular saldo disponível (salário - gastos do mês atual)
  useEffect(() => {
    const currentMonthExpenses = getExpensesByMonth(currentMonth, currentYear);
    const totalExpenses = currentMonthExpenses.reduce((total, expense) => {
      // Considerar todos os tipos de gastos (débito e crédito)
      return total + expense.amount;
    }, 0);
    
    setBalance(salary - totalExpenses);
  }, [salary, expenses, currentMonth, currentYear]);

  // Função para definir o salário
  const setSalary = async (value: number) => {
    try {
      await AsyncStorage.setItem('@Fintra:salary', String(value));
      setSalaryState(value);
    } catch (error) {
      console.error('Erro ao salvar salário:', error);
    }
  };

  // Função para adicionar um novo gasto
  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
      const now = new Date();
      const newExpense = {
        ...expense,
        id: Date.now().toString(),
        startMonth: expense.isRecurring ? (expense.startMonth || now.getMonth() + 1) : undefined,
        startYear: expense.isRecurring ? (expense.startYear || now.getFullYear()) : undefined,
      };

      const updatedExpenses = [...expenses, newExpense];
      await AsyncStorage.setItem('@Fintra:expenses', JSON.stringify(updatedExpenses));
      setExpenses(updatedExpenses);
    } catch (error) {
      console.error('Erro ao adicionar gasto:', error);
    }
  };

  // Função para atualizar um gasto existente
  const updateExpense = async (expense: Expense) => {
    try {
      const updatedExpenses = expenses.map(item => 
        item.id === expense.id ? expense : item
      );

      await AsyncStorage.setItem('@Fintra:expenses', JSON.stringify(updatedExpenses));
      setExpenses(updatedExpenses);
    } catch (error) {
      console.error('Erro ao atualizar gasto:', error);
    }
  };

  // Função para excluir um gasto
  const deleteExpense = async (id: string) => {
    try {
      console.log('FinanceContext - Excluindo gasto com ID:', id);
      console.log('FinanceContext - Expenses antes:', expenses.length);
      
      // Converter o ID para string para garantir a comparação correta
      const stringId = String(id);
      const updatedExpenses = expenses.filter(expense => String(expense.id) !== stringId);
      
      console.log('FinanceContext - Expenses depois:', updatedExpenses.length);
      
      if (expenses.length === updatedExpenses.length) {
        console.error('Nenhuma despesa foi removida. IDs não correspondem.');
        // Imprimir todos os IDs para debug
        expenses.forEach(expense => console.log('ID disponível:', expense.id, typeof expense.id));
        console.log('ID a ser excluído:', id, typeof id);
        throw new Error('ID não encontrado');
      }
      
      // Garantir que o AsyncStorage seja atualizado antes de atualizar o estado
      await AsyncStorage.setItem('@Fintra:expenses', JSON.stringify(updatedExpenses));
      
      // Atualizar o estado com os novos dados
      setExpenses(updatedExpenses);
      
      return true; // Retornar true para indicar sucesso
    } catch (error) {
      console.error('Erro ao excluir gasto:', error);
      throw error; // Propagar o erro para ser tratado no componente
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        salary,
        setSalary,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        balance,
        getExpensesByMonth,
        currentMonth,
        currentYear,
        setCurrentMonth,
        setCurrentYear,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}