import React, { useState } from 'react';
import { StyleSheet, FlatList, Alert, TouchableOpacity, Modal, TextInput, Switch, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useFinance } from '@/contexts/FinanceContext';

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: Date;
  type: 'credit' | 'debit';
  isRecurring?: boolean;
  dueDay?: number;
  recurringMonths?: number;
  startMonth?: number;
  startYear?: number;
}

export default function ExpensesScreen() {
  const { expenses, updateExpense, deleteExpense, currentMonth, currentYear, setCurrentMonth, setCurrentYear, getExpensesByMonth } = useFinance();

  // Estado para o modal de edição
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editIsCredit, setEditIsCredit] = useState(false);
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [editDueDay, setEditDueDay] = useState('');
  const [editRecurringMonths, setEditRecurringMonths] = useState('');

  const colorScheme = useColorScheme();

  // Obter os gastos do mês atual
  const currentMonthExpenses = getExpensesByMonth(currentMonth, currentYear);
  
  // Calcular o total de gastos do mês atual
  const totalExpenses = currentMonthExpenses.reduce((total, expense) => total + expense.amount, 0);
  
  // Calcular gastos por tipo
  const debitExpenses = currentMonthExpenses
    .filter(expense => expense.type === 'debit')
    .reduce((total, expense) => total + expense.amount, 0);
    
  const creditExpenses = currentMonthExpenses
    .filter(expense => expense.type === 'credit')
    .reduce((total, expense) => total + expense.amount, 0);

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

  // Função para abrir o modal de edição
  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setEditDescription(expense.description);
    setEditAmount(expense.amount.toString());
    setEditIsCredit(expense.type === 'credit');
    setEditIsRecurring(expense.isRecurring || false);
    setEditDueDay(expense.dueDay?.toString() || '');
    setEditRecurringMonths(expense.recurringMonths?.toString() || '');
    setModalVisible(true);
  };

  // Função para salvar as alterações
  const handleSaveEdit = async () => {
    if (!editingExpense) return;

    // Validar campos
    if (!editDescription.trim()) {
      Alert.alert('Erro', 'Por favor, informe uma descrição para o gasto.');
      return;
    }

    // Normalizar o valor: substituir vírgula por ponto
    const normalizedEditAmount = editAmount.trim().replace(',', '.');
    if (!normalizedEditAmount || isNaN(Number(normalizedEditAmount)) || Number(normalizedEditAmount) <= 0) {
      Alert.alert('Erro', 'Por favor, informe um valor válido para o gasto.');
      return;
    }

    if (editIsCredit && editIsRecurring && (!editDueDay.trim() || isNaN(Number(editDueDay)) || Number(editDueDay) < 1 || Number(editDueDay) > 31)) {
      Alert.alert('Erro', 'Por favor, informe um dia de vencimento válido (1-31).');
      return;
    }

    if (editIsCredit && editIsRecurring && (!editRecurringMonths.trim() || isNaN(Number(editRecurringMonths)) || Number(editRecurringMonths) < 1)) {
      Alert.alert('Erro', 'Por favor, informe um número válido de meses para recorrência.');
      return;
    }

    // Atualizar o gasto usando o contexto
    const updatedExpense = {
      ...editingExpense,
      description: editDescription.trim(),
      amount: Number(normalizedEditAmount),
      type: editIsCredit ? 'credit' : 'debit',
      isRecurring: editIsCredit ? editIsRecurring : false,
      dueDay: editIsCredit && editIsRecurring ? Number(editDueDay) : undefined,
      recurringMonths: editIsCredit && editIsRecurring ? Number(editRecurringMonths) : undefined,
      startMonth: editingExpense.startMonth || (editIsCredit && editIsRecurring ? new Date().getMonth() + 1 : undefined),
      startYear: editingExpense.startYear || (editIsCredit && editIsRecurring ? new Date().getFullYear() : undefined),
    };

    await updateExpense(updatedExpense);
    setModalVisible(false);
    Alert.alert('Sucesso', 'Gasto atualizado com sucesso!');
  };

  // Função para excluir um gasto
  const handleDelete = (id: string) => {
    console.log('Tentando excluir gasto com ID:', id, typeof id); // Log para debug
    
    if (!id) {
      console.error('ID inválido:', id);
      Alert.alert('Erro', 'ID do gasto inválido.');
      return;
    }
    
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este gasto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Confirmou exclusão do ID:', id);
              
              // Verificar se o ID existe na lista de despesas
              const expenseToDelete = expenses.find(expense => expense.id === id);
              
              if (!expenseToDelete) {
                console.error('Despesa não encontrada com ID:', id);
                Alert.alert('Erro', 'Despesa não encontrada.');
                return;
              }
              
              console.log('Despesa a ser excluída:', expenseToDelete);
              
              await deleteExpense(id);
              
              // Forçar uma atualização da interface
              Alert.alert(
                'Sucesso', 
                'Gasto excluído com sucesso!',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Erro ao excluir:', error);
              Alert.alert('Erro', 'Não foi possível excluir o gasto. Tente novamente.');
            }
          } 
        },
      ]
    );
  };

  // Renderizar cada item da lista
  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const formattedDate = new Date(item.date).toLocaleDateString('pt-BR');
    console.log('Renderizando item com ID:', item.id); // Adicionar log para verificar o ID
    
    return (
      <ThemedView style={styles.expenseItem}>
        <ThemedView style={styles.expenseHeader}>
          <ThemedText type="defaultSemiBold">{item.description}</ThemedText>
          <ThemedView style={styles.expenseActions}>
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
              <IconSymbol size={20} name="pencil" color={Colors[colorScheme ?? 'light'].tint} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                const itemId = item.id;
                console.log('Botão de exclusão pressionado para ID:', itemId, typeof itemId);
                // Garantir que o ID seja uma string
                handleDelete(String(itemId));
              }} 
              style={[styles.actionButton, { 
                backgroundColor: 'rgba(231,76,60,0.1)',
                padding: 15,
                borderRadius: 8,
              }]}
              activeOpacity={0.6}
            >
              <IconSymbol size={20} name="trash" color="#e74c3c" />
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
        
        <ThemedView style={styles.expenseDetails}>
          <ThemedText>Valor: R$ {item.amount.toFixed(2)}</ThemedText>
          <ThemedText>Data: {formattedDate}</ThemedText>
          <ThemedText>
            Tipo: {item.type === 'credit' ? 'Crédito' : 'Débito'}
            {item.type === 'credit' && item.isRecurring && ` (Recorrente, dia ${item.dueDay}, ${item.recurringMonths} meses)`}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Seus Gastos</ThemedText>
      
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
      
      {/* Resumo dos gastos */}
      <ThemedView style={styles.summaryContainer}>
        <ThemedText type="defaultSemiBold" style={styles.summaryText}>
          Total: R$ {totalExpenses.toFixed(2)}
        </ThemedText>
        <ThemedView style={styles.summaryDetails}>
          <ThemedText style={styles.summaryDetailText}>Débito: R$ {debitExpenses.toFixed(2)}</ThemedText>
          <ThemedText style={styles.summaryDetailText}>Crédito: R$ {creditExpenses.toFixed(2)}</ThemedText>
        </ThemedView>
      </ThemedView>
      
      {currentMonthExpenses.length === 0 ? (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
            Você não possui gastos cadastrados para {getMonthName(currentMonth)} de {currentYear}.
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={currentMonthExpenses}
          renderItem={renderExpenseItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Modal de edição */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContainer}>
            <ThemedText type="subtitle" style={styles.modalTitle}>Editar Gasto</ThemedText>
            
            <ThemedView style={styles.formGroup}>
              <ThemedText>Descrição</ThemedText>
              <TextInput
                style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                value={editDescription}
                onChangeText={setEditDescription}
              />
            </ThemedView>
            
            <ThemedView style={styles.formGroup}>
              <ThemedText>Valor (R$)</ThemedText>
              <TextInput
                style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                keyboardType="numeric"
                value={editAmount}
                onChangeText={setEditAmount}
              />
            </ThemedView>
            
            <ThemedView style={styles.switchContainer}>
              <ThemedText>Crédito</ThemedText>
              <Switch
                value={editIsCredit}
                onValueChange={setEditIsCredit}
                trackColor={{ false: '#767577', true: Colors[colorScheme ?? 'light'].tint }}
              />
            </ThemedView>
            
            {editIsCredit && (
              <ThemedView style={styles.switchContainer}>
                <ThemedText>Gasto Recorrente</ThemedText>
                <Switch
                  value={editIsRecurring}
                  onValueChange={setEditIsRecurring}
                  trackColor={{ false: '#767577', true: Colors[colorScheme ?? 'light'].tint }}
                />
              </ThemedView>
            )}
            
            {editIsCredit && editIsRecurring && (
              <>
                <ThemedView style={styles.formGroup}>
                  <ThemedText>Dia de Vencimento</ThemedText>
                  <TextInput
                    style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                    keyboardType="numeric"
                    value={editDueDay}
                    onChangeText={setEditDueDay}
                    maxLength={2}
                  />
                </ThemedView>
                
                <ThemedView style={styles.formGroup}>
                  <ThemedText>Número de Meses</ThemedText>
                  <TextInput
                    style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                    keyboardType="numeric"
                    value={editRecurringMonths}
                    onChangeText={setEditRecurringMonths}
                    maxLength={2}
                  />
                </ThemedView>
              </>
            )}
            
            <ThemedView style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText style={styles.buttonText}>Cancelar</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <ThemedText style={styles.buttonText}>Salvar</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  monthButton: {
    padding: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  expenseItem: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 16,
    padding: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
    minHeight: 50,
  },
  expenseDetails: {
    gap: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  saveButton: {
    backgroundColor: '#2ecc71',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Adicionar estes novos estilos
  summaryContainer: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 18,
    marginBottom: 8,
  },
  summaryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryDetailText: {
    fontSize: 14,
  },
});