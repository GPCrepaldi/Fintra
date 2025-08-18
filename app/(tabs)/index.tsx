import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useFinance } from '@/contexts/FinanceContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';

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

export default function DashboardScreen() {
  const { salary, expenses, balance, currentMonth, currentYear, setCurrentMonth, setCurrentYear, getExpensesByMonth } = useFinance();
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

  // Obter os gastos do mês atual
  const currentMonthExpenses = getExpensesByMonth(currentMonth, currentYear);
  
  // Calcular o total de gastos do mês atual
  const totalExpenses = currentMonthExpenses.reduce((total, expense) => total + expense.amount, 0);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={null}>
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
        </ThemedView>

        <ThemedView style={styles.summaryContainer}>
          <ThemedText type="subtitle">Resumo</ThemedText>
          
          {currentMonthExpenses.length === 0 ? (
            <ThemedText style={styles.emptyText}>
              Nenhum gasto registrado para {getMonthName(currentMonth)} de {currentYear}. Adicione gastos para visualizar seu resumo financeiro.
            </ThemedText>
          ) : (
            <ThemedView style={styles.summaryContent}>
              <ThemedView style={styles.summaryItem}>
                <ThemedText>Gastos no Débito</ThemedText>
                <ThemedText>
                  R$ {currentMonthExpenses
                    .filter(expense => expense.type === 'debit')
                    .reduce((total, expense) => total + expense.amount, 0)
                    .toFixed(2)}
                </ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.summaryItem}>
                <ThemedText>Gastos no Crédito</ThemedText>
                <ThemedText>
                  R$ {currentMonthExpenses
                    .filter(expense => expense.type === 'credit')
                    .reduce((total, expense) => total + expense.amount, 0)
                    .toFixed(2)}
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
});
