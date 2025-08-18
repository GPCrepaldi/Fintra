# Fintra - Gerenciador Financeiro

Fintra é um aplicativo de gerenciamento financeiro pessoal desenvolvido como Trabalho de Graduação. O aplicativo permite que o usuário controle seus gastos, registre seu salário mensal e acompanhe seu saldo disponível.

## Funcionalidades

- **Registro de Salário**: Informe seu salário mensal para cálculo do saldo disponível.
- **Adição de Gastos**: Registre seus gastos, informando se são no crédito ou débito.
- **Gastos Recorrentes**: Para gastos no crédito, é possível definir se são recorrentes e o dia de vencimento.
- **Gestão de Gastos**: Edite ou exclua gastos cadastrados conforme necessário.
- **Visualização de Saldo**: Acompanhe seu saldo disponível e um resumo dos seus gastos.

## Tecnologias Utilizadas

- React Native
- Expo
- TypeScript
- AsyncStorage para persistência de dados
- Context API para gerenciamento de estado

## Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/fintra.git
   cd fintra
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o aplicativo:
   ```bash
   npm start
   ```

4. Use o aplicativo Expo Go no seu dispositivo móvel para escanear o QR code ou execute em um emulador.

## Estrutura do Projeto

- `/app`: Contém as telas do aplicativo organizadas por abas
- `/components`: Componentes reutilizáveis
- `/contexts`: Contextos para gerenciamento de estado
- `/constants`: Constantes como cores e temas
- `/hooks`: Hooks personalizados

## Contribuição

Este projeto foi desenvolvido como Trabalho de Graduação. Contribuições são bem-vindas através de pull requests.

## Licença

Este projeto está licenciado sob a licença MIT.
