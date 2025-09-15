import React, { useState } from 'react';
import { StyleSheet, TextInput, Switch, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { useFinance } from '@/contexts/FinanceContext';

export default function AddExpenseScreen() {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isIncome, setIsIncome] = useState(false); // true = ganho, false = gasto
  const [isCredit, setIsCredit] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [dueDay, setDueDay] = useState('');
  const [recurringMonths, setRecurringMonths] = useState('');
  const colorScheme = useColorScheme();

  const { addTransaction } = useFinance();

  const handleSaveTransaction = async () => {
    // Validar campos
    if (!description.trim()) {
      Alert.alert('Erro', `Por favor, informe uma descrição para ${isIncome ? 'o ganho' : 'o gasto'}.`);
      return;
    }

    // Normalizar o valor: substituir vírgula por ponto
    const normalizedAmount = amount.trim().replace(',', '.');
    if (!normalizedAmount || isNaN(Number(normalizedAmount)) || Number(normalizedAmount) <= 0) {
      Alert.alert('Erro', `Por favor, informe um valor válido para ${isIncome ? 'o ganho' : 'o gasto'}.`);
      return;
    }

    // Validações específicas para gastos
    if (!isIncome && isCredit && isRecurring && (!dueDay.trim() || isNaN(Number(dueDay)) || Number(dueDay) < 1 || Number(dueDay) > 31)) {
      Alert.alert('Erro', 'Por favor, informe um dia de vencimento válido (1-31).');
      return;
    }

    if (!isIncome && isCredit && isRecurring && (!recurringMonths.trim() || isNaN(Number(recurringMonths)) || Number(recurringMonths) < 1)) {
      Alert.alert('Erro', 'Por favor, informe um número válido de meses para recorrência.');
      return;
    }

    // Criar objeto de transação
    const newTransaction = {
      description: description.trim(),
      amount: Number(normalizedAmount),
      date: new Date(),
      category: isIncome ? 'income' : 'expense',
      type: isIncome ? 'income' : (isCredit ? 'credit' : 'debit'),
      isRecurring: isCredit ? isRecurring : false,
      dueDay: isCredit && isRecurring ? Number(dueDay) : undefined,
      recurringMonths: isCredit && isRecurring ? Number(recurringMonths) : undefined,
      startMonth: new Date().getMonth() + 1, // 1-12
      startYear: new Date().getFullYear(),
    };

    // Salvar a transação usando o contexto
    await addTransaction(newTransaction);
    
    // Limpar os campos imediatamente após adicionar
    setDescription('');
    setAmount('');
    setIsIncome(false);
    setIsCredit(false);
    setIsRecurring(false);
    setDueDay('');
    setRecurringMonths('');
    
    Alert.alert(
      'Sucesso',
      `${isIncome ? 'Ganho' : 'Gasto'} adicionado com sucesso!`,
      [
        { 
          text: 'OK', 
          onPress: () => {
            // Voltar para a tela anterior
            router.back();
          } 
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.scrollView}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          {isIncome ? 'Adicionar Ganho' : 'Adicionar Gasto'}
        </ThemedText>
        
        <ThemedView style={styles.switchContainer}>
          <ThemedText>Tipo de Transação</ThemedText>
          <ThemedView style={styles.typeSelector}>
            <TouchableOpacity 
              style={[styles.typeButton, !isIncome && styles.typeButtonActive]}
              onPress={() => setIsIncome(false)}
            >
              <ThemedText style={[styles.typeButtonText, !isIncome && styles.typeButtonTextActive]}>Gasto</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeButton, isIncome && styles.typeButtonActive]}
              onPress={() => setIsIncome(true)}
            >
              <ThemedText style={[styles.typeButtonText, isIncome && styles.typeButtonTextActive]}>Ganho</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
        
        <ThemedView style={styles.formGroup}>
          <ThemedText>Descrição</ThemedText>
          <TextInput
            style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
            placeholder={isIncome ? "Ex: Freelance, Venda, etc" : "Ex: Supermercado, Aluguel, etc"}
            placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
            value={description}
            onChangeText={setDescription}
          />
        </ThemedView>
        
        <ThemedView style={styles.formGroup}>
          <ThemedText>Valor (R$)</ThemedText>
          <TextInput
            style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
            placeholder="0.00"
            placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </ThemedView>
        
        {!isIncome && (
          <ThemedView style={styles.switchContainer}>
            <ThemedText>Crédito</ThemedText>
            <Switch
              value={isCredit}
              onValueChange={setIsCredit}
              trackColor={{ false: '#767577', true: Colors[colorScheme ?? 'light'].tint }}
            />
          </ThemedView>
        )}
        
        {!isIncome && isCredit && (
          <ThemedView style={styles.switchContainer}>
            <ThemedText>Gasto Recorrente</ThemedText>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: '#767577', true: Colors[colorScheme ?? 'light'].tint }}
            />
          </ThemedView>
        )}
        
        {!isIncome && isCredit && isRecurring && (
          <>
            <ThemedView style={styles.formGroup}>
              <ThemedText>Dia de Vencimento</ThemedText>
              <TextInput
                style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                keyboardType="numeric"
                value={dueDay}
                onChangeText={setDueDay}
                maxLength={2}
                placeholder="Ex: 10"
                placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              />
            </ThemedView>
            
            <ThemedView style={styles.formGroup}>
              <ThemedText>Número de Meses</ThemedText>
              <TextInput
                style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                keyboardType="numeric"
                value={recurringMonths}
                onChangeText={setRecurringMonths}
                maxLength={2}
                placeholder="Ex: 3"
                placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              />
            </ThemedView>
          </>
        )}
        
        <ThemedView style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: Colors[colorScheme ?? 'light'].secondary }]}
            onPress={handleSaveTransaction}
          >
            <ThemedText style={styles.buttonText}>Salvar</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 12, // Reduzindo o padding
    paddingTop: 40, // Reduzindo o padding superior
  },
  title: {
    marginBottom: 16, // Reduzindo a margem
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 12, // Reduzindo a margem
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10, // Reduzindo o padding
    marginTop: 6, // Reduzindo a margem
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12, // Reduzindo a margem
  },
  buttonContainer: {
    marginTop: 16, // Reduzindo a margem
    alignItems: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  typeSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: Colors.light.secondary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: 'black',
  },
});