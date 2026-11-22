export const environment = {
  production: false,
  apiUrl: 'http://localhost:5274',
  // false: livro na API (fm_back). true: fallback só no navegador.
  dadosLocais: false,
  // Preencha com a configuração pública do projeto Firebase. Vazio, o login roda em modo local.
  firebase: {
    apiKey: "AIzaSyC6l4ZQ194xJvkvzLFbpdexnLmKS2W6H6Q",
    authDomain: "finance-master-26c82.firebaseapp.com",
    projectId: "finance-master-26c82",
    storageBucket: "finance-master-26c82.firebasestorage.app",
    messagingSenderId: "317739937327",
    appId: "1:317739937327:web:8c315111c05f2e389c60da",
    measurementId: "G-LPYGNDWNVS"
  },
};
