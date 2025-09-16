import { StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useFinance } from '@/contexts/FinanceContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: 'expense' | 'income';
  type: 'credit' | 'debit' | 'income';
  isRecurring?: boolean;
  dueDay?: number;
  recurringMonths?: number;
  startMonth?: number;
  startYear?: number;
}

export default function DashboardScreen() {
  const { salary, balance, currentMonth, currentYear, setCurrentMonth, setCurrentYear, getTransactionsByMonth } = useFinance();
  const colorScheme = useColorScheme();

  // Função para navegar para o mês anterior
  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // Função para navegar para o próximo mês
  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Função para formatar o nome do mês
  const getMonthName = (month: number) => {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return monthNames[month - 1];
  };

  // Obter as transações do mês atual
  const currentMonthTransactions = getTransactionsByMonth(currentMonth, currentYear);
  
  // Separar gastos e ganhos
  const currentMonthExpenses = currentMonthTransactions.filter(transaction => transaction.category === 'expense');
  const currentMonthIncome = currentMonthTransactions.filter(transaction => transaction.category === 'income');
  
  // Calcular totais
  const totalExpenses = currentMonthExpenses.reduce((total, expense) => total + expense.amount, 0);
  const totalIncome = currentMonthIncome.reduce((total, income) => total + income.amount, 0);
  const debitExpenses = currentMonthExpenses.filter(expense => expense.type === 'debit').reduce((total, expense) => total + expense.amount, 0);
  const creditExpenses = currentMonthExpenses.filter(expense => expense.type === 'credit').reduce((total, expense) => total + expense.amount, 0);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#90EE90' }}
      headerImage={
        <Image 
          source={require('@/assets/images/logo.png')} 
          style={styles.headerLogo}
          resizeMode="contain"
        />
      }>
      <ThemedView style={styles.container}>
        {/* Navegação entre meses */}
        <ThemedView style={styles.monthNavigation}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthButton}>
            <IconSymbol size={24} name="chevron.left" color={Colors[colorScheme ?? 'light'].text} />
          </TouchableOpacity>
          
          <ThemedText type="subtitle">
            {getMonthName(currentMonth)} {currentYear}
          </ThemedText>
          
          <TouchableOpacity onPress={goToNextMonth} style={styles.monthButton}>
            <IconSymbol size={24} name="chevron.right" color={Colors[colorScheme ?? 'light'].text} />
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.balanceContainer}>
          <ThemedText type="subtitle">Saldo Disponível</ThemedText>
          <ThemedText type="title">R$ {balance.toFixed(2)}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.infoContainer}>
          <ThemedView style={styles.infoItem}>
            <ThemedText>Salário</ThemedText>
            <ThemedText type="defaultSemiBold">R$ {salary.toFixed(2)}</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.infoItem}>
            <ThemedText>Total de Gastos</ThemedText>
            <ThemedText type="defaultSemiBold" style={{ color: '#e74c3c' }}>
              R$ {totalExpenses.toFixed(2)}
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.infoItem}>
            <ThemedText>Total de Ganhos</ThemedText>
            <ThemedText type="defaultSemiBold" style={{ color: '#27ae60' }}>
              R$ {totalIncome.toFixed(2)}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.summaryContainer}>
          <ThemedText type="subtitle">Resumo</ThemedText>
          
          {currentMonthTransactions.length === 0 ? (
            <ThemedText style={styles.emptyText}>
              Nenhuma transação registrada para {getMonthName(currentMonth)} de {currentYear}. Adicione gastos ou ganhos para visualizar seu resumo financeiro.
            </ThemedText>
          ) : (
            <ThemedView style={styles.summaryContent}>
              <ThemedView style={styles.summaryItem}>
                <ThemedText>Gastos no Débito</ThemedText>
                <ThemedText style={{ color: '#e74c3c' }}>
                  R$ {debitExpenses.toFixed(2)}
                </ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.summaryItem}>
                <ThemedText>Gastos no Crédito</ThemedText>
                <ThemedText style={{ color: '#e74c3c' }}>
                  R$ {creditExpenses.toFixed(2)}
                </ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.summaryItem}>
                <ThemedText>Total de Ganhos</ThemedText>
                <ThemedText style={{ color: '#27ae60' }}>
                  R$ {totalIncome.toFixed(2)}
                </ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.summaryItem}>
                <ThemedText>Saldo do Mês</ThemedText>
                <ThemedText type="defaultSemiBold" style={{ color: (totalIncome - totalExpenses) >= 0 ? '#27ae60' : '#e74c3c' }}>
                  R$ {(totalIncome - totalExpenses).toFixed(2)}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          )}
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  monthButton: {
    padding: 10,
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoContainer: {
    marginBottom: 16,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryContainer: {
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryContent: {
    marginTop: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  headerLogo: {
    width: 600,
    height: 300,
    alignSelf: 'center',
    marginTop: -60,
  },
});
