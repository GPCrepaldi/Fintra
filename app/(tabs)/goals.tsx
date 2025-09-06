import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '@/contexts/FinanceContext';

interface Goal {
  id: string;
  name: string;
  totalTarget: number;
  monthlyTarget: number;
  currentAmount: number;
  createdAt: Date;
  isActive: boolean;
}

interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  month: number;
  year: number;
  isComplete: boolean;
  date: Date;
}

export default function Goals() {
  const {
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
    currentMonth,
    currentYear,
  } = useFinance();

  const [modalVisible, setModalVisible] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [totalTarget, setTotalTarget] = useState('');
  const [monthlyTarget, setMonthlyTarget] = useState('');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [tempContributionDay, setTempContributionDay] = useState(goalContributionDay.toString());

  const availableBalance = getAvailableBalance(currentMonth, currentYear);
  const monthlyContributions = getGoalContributionsByMonth(currentMonth, currentYear);

  // Atualizar tempContributionDay quando goalContributionDay mudar
  useEffect(() => {
    setTempContributionDay(goalContributionDay.toString());
  }, [goalContributionDay]);

  const handleSaveContributionDay = async () => {
    const day = parseInt(tempContributionDay);
    if (isNaN(day) || day < 1 || day > 31) {
      Alert.alert('Erro', 'Por favor, insira um dia válido entre 1 e 31.');
      return;
    }
    
    try {
      await setGoalContributionDay(day);
      setConfigModalVisible(false);
      Alert.alert('Sucesso', 'Dia de contribuição atualizado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Erro ao salvar configuração.');
    }
  };

  const handleAddGoal = async () => {
    if (!goalName.trim() || !totalTarget.trim() || !monthlyTarget.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    const total = parseFloat(totalTarget.replace(',', '.'));
    const monthly = parseFloat(monthlyTarget.replace(',', '.'));
    
    if (isNaN(total) || total <= 0 || isNaN(monthly) || monthly <= 0) {
      Alert.alert('Erro', 'Por favor, insira valores válidos.');
      return;
    }

    if (monthly > total) {
      Alert.alert('Erro', 'O valor mensal não pode ser maior que o valor total da meta.');
      return;
    }

    try {
      if (editingGoal) {
        await updateGoal({
          ...editingGoal,
          name: goalName,
          totalTarget: total,
          monthlyTarget: monthly,
        });
      } else {
        await addGoal({
          name: goalName,
          totalTarget: total,
          monthlyTarget: monthly,
          isActive: true,
        });
      }

      setModalVisible(false);
      setGoalName('');
      setTotalTarget('');
      setMonthlyTarget('');
      setEditingGoal(null);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a meta.');
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setTotalTarget(goal.totalTarget?.toString() || '');
    setMonthlyTarget(goal.monthlyTarget.toString());
    setModalVisible(true);
  };

  const handleDeleteGoal = (goal: Goal) => {
    console.log('🗑️ Excluindo meta:', goal.name);
    deleteGoal(goal.id);
  };

  const handleToggleGoalStatus = async (goal: Goal) => {
    await updateGoal({
      ...goal,
      isActive: !goal.isActive,
    });
  };

  const handleProcessMonthlyContributions = async () => {
    await processMonthlyGoalContributions(currentMonth, currentYear);
    Alert.alert('Sucesso', 'Contribuições mensais processadas!');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getGoalProgress = (goal: Goal) => {
    if (goal.totalTarget === 0) return 0;
    return Math.min((goal.currentAmount / goal.totalTarget) * 100, 100);
  };

  const renderGoalItem = ({ item: goal }: { item: Goal }) => {
    const progress = getGoalProgress(goal);
    const monthlyContribution = monthlyContributions.find(c => c.goalId === goal.id);
    
    return (
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={styles.goalInfo}>
            <Text style={styles.goalName}>{goal.name}</Text>
            <Text style={styles.goalTarget}>
              Meta total: {formatCurrency(goal.totalTarget)}
            </Text>
            <Text style={styles.goalTarget}>
              Meta mensal: {formatCurrency(goal.monthlyTarget)}
            </Text>
            <Text style={styles.goalCurrent}>
              Total acumulado: {formatCurrency(goal.currentAmount)}
            </Text>
          </View>
          <View style={styles.goalActions}>
            <TouchableOpacity
              style={[styles.statusButton, goal.isActive ? styles.activeButton : styles.inactiveButton]}
              onPress={() => handleToggleGoalStatus(goal)}
            >
              <Text style={styles.statusButtonText}>
                {goal.isActive ? 'Ativa' : 'Inativa'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditGoal(goal)}
            >
              <Ionicons name="pencil" size={16} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteGoal(goal)}
            >
              <Ionicons name="trash" size={16} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress.toFixed(1)}%</Text>
        </View>
        
        {monthlyContribution && (
          <View style={styles.monthlyContribution}>
            <Text style={[
              styles.contributionText,
              monthlyContribution.isComplete ? styles.completeContribution : styles.incompleteContribution
            ]}>
              Este mês: {formatCurrency(monthlyContribution.amount)}
              {!monthlyContribution.isComplete && ' (Valor incompleto)'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Metas de Economia</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.configButton} 
            onPress={() => setConfigModalVisible(true)}
          >
            <Ionicons name="settings-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumo do Mês</Text>
        <Text style={styles.summaryText}>
          Saldo disponível: {formatCurrency(availableBalance)}
        </Text>
        <Text style={styles.summaryText}>
          Contribuições processadas: {monthlyContributions.length}
        </Text>
        <Text style={styles.summaryText}>
          Dia de contribuição: {goalContributionDay}
        </Text>
        
        {availableBalance > 0 && goals.some(g => g.isActive) && (
          <TouchableOpacity
            style={styles.processButton}
            onPress={handleProcessMonthlyContributions}
          >
            <Text style={styles.processButtonText}>Processar Contribuições do Mês</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={goals}
        renderItem={renderGoalItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.goalsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="target" size={64} color="#C7C7CC" />
            <Text style={styles.emptyText}>Nenhuma meta criada</Text>
            <Text style={styles.emptySubtext}>Toque no + para adicionar sua primeira meta</Text>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setEditingGoal(null);
          setGoalName('');
          setTotalTarget('');
          setMonthlyTarget('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingGoal ? 'Editar Meta' : 'Nova Meta'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setEditingGoal(null);
                  setGoalName('');
                  setTotalTarget('');
                  setMonthlyTarget('');
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nome da Meta</Text>
              <TextInput
                style={styles.input}
                value={goalName}
                onChangeText={setGoalName}
                placeholder="Ex: Viagem de férias"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Valor Total da Meta (R$)</Text>
              <TextInput
                style={styles.input}
                value={totalTarget}
                onChangeText={setTotalTarget}
                placeholder="Ex: 5000,00"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Valor Mensal (R$)</Text>
              <TextInput
                style={styles.input}
                value={monthlyTarget}
                onChangeText={setMonthlyTarget}
                placeholder="Ex: 500,00"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleAddGoal}>
              <Text style={styles.saveButtonText}>
                {editingGoal ? 'Atualizar' : 'Criar Meta'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Configuração do Dia de Contribuição */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={configModalVisible}
        onRequestClose={() => setConfigModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configurar Dia de Contribuição</Text>
              <TouchableOpacity onPress={() => setConfigModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.configDescription}>
              Defina o dia do mês em que os valores serão adicionados automaticamente às suas metas. Esta configuração se aplica a todas as metas.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Dia do Mês (1-31)</Text>
              <TextInput
                style={styles.input}
                value={tempContributionDay}
                onChangeText={setTempContributionDay}
                placeholder="Ex: 15"
                placeholderTextColor="#999"
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveContributionDay}>
              <Text style={styles.saveButtonText}>Salvar Configuração</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  configButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#000',
  },
  summaryText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  processButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  processButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  goalsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  goalCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
  },
  goalTarget: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  goalCurrent: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  goalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeButton: {
    backgroundColor: '#34C759',
  },
  inactiveButton: {
    backgroundColor: '#FF9500',
  },
  statusButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  monthlyContribution: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  contributionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  completeContribution: {
    color: '#34C759',
  },
  incompleteContribution: {
    color: '#FF3B30',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#C7C7CC',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F2F2F7',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  configDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
});