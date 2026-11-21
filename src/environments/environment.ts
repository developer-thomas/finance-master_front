export const environment = {
  production: false,
  apiUrl: 'http://localhost:5274',
  // Enquanto a API autenticada não estiver completa, os dados ficam no navegador, separados por usuário.
  dadosLocais: true,
  // Preencha com a configuração pública do projeto Firebase. Vazio, o login roda em modo local.
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    appId: '',
  },
};
