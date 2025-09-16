import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useFinance } from '@/contexts/FinanceContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

export default function SettingsScreen() {
  const { 
    salary: contextSalary, 
    setSalary: setContextSalary,
    transactions,
    goals,
    goalContributions,
    setTransactions,
    setGoals,
    setGoalContributions
  } = useFinance();
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

  const exportData = () => {
    try {
      // Criar dados para exportação
      const data = {
        salario: contextSalary,
        transacoes: transactions.map(t => ({
          id: t.id,
          descricao: t.description,
          valor: t.amount,
          data: new Date(t.date).toLocaleDateString('pt-BR'),
          categoria: t.category,
          tipo: t.type,
          recorrente: t.isRecurring ? 'Sim' : 'Não'
        })),
        metas: goals.map(g => ({
          id: g.id,
          nome: g.name,
          valorAlvo: g.totalTarget,
          valorAtual: g.currentAmount,
          progresso: `${((g.currentAmount / g.totalTarget) * 100).toFixed(1)}%`,
          ativa: g.isActive ? 'Sim' : 'Não'
        })),
        contribuicoes: goalContributions.map(c => {
          const goal = goals.find(g => g.id === c.goalId);
          return {
            id: c.id,
            meta: goal?.name || 'Meta não encontrada',
            valor: c.amount,
            mes: c.month,
            ano: c.year,
            data: new Date(c.date).toLocaleDateString('pt-BR')
          };
        }),
        resumo: {
          totalTransacoes: transactions.length,
          totalMetas: goals.length,
          totalContribuicoes: goalContributions.length,
          dataExportacao: new Date().toLocaleDateString('pt-BR')
        }
      };
      
      // Criar arquivo JSON para download
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Criar link para download
      const a = document.createElement('a');
      a.href = url;
      a.download = `fintra_dados_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      Alert.alert('Sucesso', 'Dados exportados com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      Alert.alert('Erro', 'Não foi possível exportar os dados.');
    }
  };

  const importData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Ler o arquivo
        const response = await fetch(file.uri);
        const jsonText = await response.text();
        const importedData = JSON.parse(jsonText);

        // Validar estrutura dos dados
        if (!importedData.salario && !importedData.transacoes && !importedData.metas && !importedData.contribuicoes) {
          Alert.alert('Erro', 'Arquivo não contém dados válidos do Fintra.');
          return;
        }

        // Confirmar importação
        Alert.alert(
          'Confirmar Importação',
          'Isso substituirá todos os seus dados atuais. Deseja continuar?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Importar',
              onPress: () => {
                // Importar dados
                if (importedData.salario !== undefined) setContextSalary(importedData.salario);
                if (importedData.transacoes) setTransactions(importedData.transacoes);
                if (importedData.metas) setGoals(importedData.metas);
                if (importedData.contribuicoes) setGoalContributions(importedData.contribuicoes);
                
                Alert.alert('Sucesso', 'Dados importados com sucesso!');
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao importar dados: ' + error.message);
    }
  };



  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            style={[styles.button, { backgroundColor: Colors[colorScheme ?? 'light'].secondary }]}
            onPress={handleSaveSalary}
          >
            <ThemedText style={styles.buttonText}>Salvar</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Exportar Dados</ThemedText>
          <ThemedText style={styles.description}>
            Exporte todas as suas informações financeiras para uma planilha Excel.
          </ThemedText>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: Colors[colorScheme ?? 'light'].secondary }]}
            onPress={exportData}
          >
            <ThemedText style={styles.buttonText}>📊 Exportar Dados</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: Colors[colorScheme ?? 'light'].secondary, marginTop: 10 }]}
            onPress={importData}
          >
            <ThemedText style={styles.buttonText}>📁 Importar Dados</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Sobre o Aplicativo</ThemedText>
          <ThemedText style={styles.description}>
            Fintra é um aplicativo de gerenciamento financeiro pessoal desenvolvido como Trabalho de Graduação.
          </ThemedText>
          <ThemedText style={styles.version}>Versão 1.2.1</ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingTop: 40,
    paddingBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
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
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  version: {
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});