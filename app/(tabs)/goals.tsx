import React, { useState, useEffect } from 'react';
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
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Interface Goal removida - usando a do FinanceContext

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
  
  const colorScheme = useColorScheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [totalTarget, setTotalTarget] = useState('');
  const [contributionType, setContributionType] = useState<'fixed' | 'percentage'>('fixed');
  const [contributionValue, setContributionValue] = useState('');
  const [editingGoal, setEditingGoal] = useState<any>(null);
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
    if (!goalName.trim() || !totalTarget.trim() || !contributionValue.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    const total = parseFloat(totalTarget.replace(',', '.'));
    const contribution = parseFloat(contributionValue.replace(',', '.'));
    
    if (isNaN(total) || total <= 0 || isNaN(contribution) || contribution <= 0) {
      Alert.alert('Erro', 'Por favor, insira valores válidos.');
      return;
    }

    if (contributionType === 'percentage' && contribution > 100) {
      Alert.alert('Erro', 'A porcentagem não pode ser maior que 100%.');
      return;
    }

    try {
      if (editingGoal) {
        await updateGoal({
          ...editingGoal,
          name: goalName,
          totalTarget: total,
          contributionType,
          contributionValue: contribution,
        });
      } else {
        await addGoal({
          name: goalName,
          totalTarget: total,
          contributionType,
          contributionValue: contribution,
          isActive: true,
        });
      }

      setModalVisible(false);
      setGoalName('');
      setTotalTarget('');
      setContributionType('fixed');
      setContributionValue('');
      setEditingGoal(null);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a meta.');
    }
  };

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setTotalTarget(goal.totalTarget?.toString() || '');
    setContributionType(goal.contributionType || 'fixed');
    setContributionValue(goal.contributionValue?.toString() || '');
    setModalVisible(true);
  };

  const handleDeleteGoal = (goal: any) => {
    console.log('🗑️ Excluindo meta:', goal.name);
    deleteGoal(goal.id);
  };

  const handleToggleGoalStatus = async (goal: any) => {
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

  const getGoalProgress = (goal: any) => {
    if (goal.totalTarget === 0) return 0;
    return Math.min((goal.currentAmount / goal.totalTarget) * 100, 100);
  };

  const renderGoalItem = ({ item: goal }: { item: any }) => {
    const progress = getGoalProgress(goal);
    const monthlyContribution = monthlyContributions.find(c => c.goalId === goal.id);
    
    return (
      <ThemedView style={[styles.goalCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <View style={styles.goalHeader}>
          <View style={styles.goalInfo}>
            <ThemedText style={styles.goalName}>{goal.name}</ThemedText>
            <ThemedText style={styles.goalTarget}>
              Meta total: {formatCurrency(goal.totalTarget)}
            </ThemedText>
            <ThemedText style={styles.goalTarget}>
              Contribuição: {goal.contributionType === 'percentage' ? `${goal.contributionValue}%` : formatCurrency(goal.contributionValue)}
            </ThemedText>
            <ThemedText style={styles.goalCurrent}>
              Total acumulado: {formatCurrency(goal.currentAmount)}
            </ThemedText>
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
            <View 
              style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} 
            />
          </View>
          <ThemedText style={styles.progressText}>{progress.toFixed(1)}%</ThemedText>
        </View>
        
        {monthlyContribution && (
          <View style={[styles.monthlyContribution, 
            monthlyContribution.isComplete ? { backgroundColor: '#E8F5E8' } : { backgroundColor: '#FFF2F2' }
          ]}>
            <Text style={[
              styles.contributionText,
              monthlyContribution.isComplete ? styles.completeContribution : styles.incompleteContribution
            ]}>
              Contribuição {currentMonth}/{currentYear}: {formatCurrency(monthlyContribution.amount)} 
              {monthlyContribution.isComplete ? ' ✓' : ' ⏳'}
            </Text>
          </View>
        )}
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={[styles.header, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <ThemedText style={styles.title}>Metas</ThemedText>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.configButton, { backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault }]}
            onPress={() => setConfigModalVisible(true)}
          >
            <Ionicons name="settings-outline" size={24} color={Colors[colorScheme ?? 'light'].tint} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </ThemedView>

      <ThemedView style={[styles.summaryCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <ThemedText style={styles.summaryTitle}>Resumo do Mês</ThemedText>
        <ThemedText style={styles.summaryText}>
          Saldo disponível: {formatCurrency(availableBalance)}
        </ThemedText>
        <ThemedText style={styles.summaryText}>
          Contribuições processadas: {monthlyContributions.length}
        </ThemedText>
        <ThemedText style={styles.summaryText}>
          Dia de contribuição: {goalContributionDay}
        </ThemedText>
        
        {availableBalance > 0 && goals.some(g => g.isActive) && (
          <TouchableOpacity
            style={styles.processButton}
            onPress={handleProcessMonthlyContributions}
          >
            <Text style={styles.processButtonText}>Processar Contribuições do Mês</Text>
          </TouchableOpacity>
        )}
      </ThemedView>

      <FlatList
        data={goals}
        renderItem={renderGoalItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.goalsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="target-outline" size={64} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
            <ThemedText style={styles.emptyText}>Nenhuma meta criada</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Toque no botão + para criar sua primeira meta de economia
            </ThemedText>
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
          setContributionType('fixed');
          setContributionValue('');
        }}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {editingGoal ? 'Editar Meta' : 'Nova Meta'}
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setEditingGoal(null);
                  setGoalName('');
                  setTotalTarget('');
                  setContributionType('fixed');
                  setContributionValue('');
                }}
              >
                <Ionicons name="close" size={24} color={Colors[colorScheme ?? 'light'].text} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Nome da Meta</ThemedText>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
                  borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                  color: Colors[colorScheme ?? 'light'].text
                }]}
                value={goalName}
                onChangeText={setGoalName}
                placeholder="Ex: Viagem de férias"
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Valor Total da Meta (R$)</ThemedText>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
                  borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                  color: Colors[colorScheme ?? 'light'].text
                }]}
                value={totalTarget}
                onChangeText={setTotalTarget}
                placeholder="Ex: 5000,00"
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                keyboardType="numeric"
              />
            </View>



            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Tipo de Contribuição</ThemedText>
              <View style={styles.contributionTypeContainer}>
                <TouchableOpacity
                  style={[styles.typeButton, contributionType === 'fixed' && styles.activeTypeButton]}
                  onPress={() => setContributionType('fixed')}
                >
                  <Text style={[styles.typeButtonText, contributionType === 'fixed' && styles.activeTypeButtonText]}>
                    Valor Fixo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, contributionType === 'percentage' && styles.activeTypeButton]}
                  onPress={() => setContributionType('percentage')}
                >
                  <Text style={[styles.typeButtonText, contributionType === 'percentage' && styles.activeTypeButtonText]}>
                    Porcentagem
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>
                {contributionType === 'fixed' ? 'Valor da Contribuição (R$)' : 'Porcentagem do Saldo (%)'}
              </ThemedText>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
                  borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                  color: Colors[colorScheme ?? 'light'].text
                }]}
                value={contributionValue}
                onChangeText={setContributionValue}
                placeholder={contributionType === 'fixed' ? 'Ex: 200,00' : 'Ex: 10'}
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleAddGoal}>
              <Text style={styles.saveButtonText}>
                {editingGoal ? 'Atualizar' : 'Criar Meta'}
              </Text>
            </TouchableOpacity>
          </ThemedView>
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
          <ThemedView style={[styles.modalContent, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Configurar Dia de Contribuição</ThemedText>
              <TouchableOpacity onPress={() => setConfigModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors[colorScheme ?? 'light'].text} />
              </TouchableOpacity>
            </View>

            <ThemedText style={styles.configDescription}>
              Defina o dia do mês em que os valores serão adicionados automaticamente às suas metas. Esta configuração se aplica a todas as metas.
            </ThemedText>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Dia do Mês (1-31)</ThemedText>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
                  borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                  color: Colors[colorScheme ?? 'light'].text
                }]}
                value={tempContributionDay}
                onChangeText={setTempContributionDay}
                placeholder="Ex: 15"
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveContributionDay}>
              <Text style={styles.saveButtonText}>Salvar Configuração</Text>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
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
  },
  summaryText: {
    fontSize: 16,
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
    marginBottom: 5,
  },
  goalTarget: {
    fontSize: 14,
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
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
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
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  contributionTypeContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTypeButton: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTypeButtonText: {
    color: 'white',
  },
});