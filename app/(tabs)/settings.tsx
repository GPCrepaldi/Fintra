import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useFinance } from '@/contexts/FinanceContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

export default function SettingsScreen() {
  const { salary: contextSalary, setSalary: setContextSalary } = useFinance();
  const [salary, setSalary] = useState('');
  const colorScheme = useColorScheme();

  // Carregar o salário do contexto quando a tela for montada
  useEffect(() => {
    setSalary(contextSalary.toString());
  }, [contextSalary]);

  const handleSaveSalary = async () => {
    // Normalizar o valor: substituir vírgula por ponto
    const normalizedSalary = salary.trim().replace(',', '.');
    if (!normalizedSalary || isNaN(Number(normalizedSalary)) || Number(normalizedSalary) < 0) {
      Alert.alert('Erro', 'Por favor, informe um valor válido para o salário.');
      return;
    }

    // Salvar o salário no contexto
    await setContextSalary(Number(normalizedSalary));
    Alert.alert('Sucesso', `Salário de R$ ${Number(normalizedSalary).toFixed(2)} definido com sucesso!`);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Configurações</ThemedText>
      
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Salário Mensal</ThemedText>
        <ThemedText style={styles.description}>
          Defina o valor do seu salário mensal para que o aplicativo possa calcular seu saldo disponível.
        </ThemedText>
        
        <ThemedView style={styles.formGroup}>
          <ThemedText>Valor do Salário (R$)</ThemedText>
          <TextInput
            style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
            placeholder="0.00"
            placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
            keyboardType="numeric"
            value={salary}
            onChangeText={setSalary}
          />
        </ThemedView>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
          onPress={handleSaveSalary}
        >
          <ThemedText style={styles.buttonText}>Salvar</ThemedText>
        </TouchableOpacity>
      </ThemedView>
      
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Sobre o Aplicativo</ThemedText>
        <ThemedText style={styles.description}>
          Fintra é um aplicativo de gerenciamento financeiro pessoal desenvolvido como Trabalho de Graduação.
        </ThemedText>
        <ThemedText style={styles.version}>Versão 1.2.1</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12, // Reduzindo o padding
    paddingTop: 40, // Reduzindo o padding superior
  },
  title: {
    marginBottom: 16, // Reduzindo a margem
    textAlign: 'center',
  },
  section: {
    marginBottom: 24, // Reduzindo a margem
    padding: 12, // Reduzindo o padding
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 8, // Reduzindo a margem
  },
  description: {
    marginBottom: 12, // Reduzindo a margem
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
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  version: {
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});