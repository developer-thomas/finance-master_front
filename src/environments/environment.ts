export const environment = {
  production: false,
  apiUrl: 'http://localhost:5274',
  // false: livro na API (fm_back). true: fallback só no navegador.
  dadosLocais: false,
  // Preencha com a configuração pública do projeto Firebase. Vazio, o login roda em modo local.
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    appId: '',
  },
};
