/** Copie para environment.ts / environment.prod.ts e ajuste. */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5274',
  // false = API (Firebase + Gemini). true = só navegador (foto não chama a API).
  dadosLocais: false,
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: '',
  },
};
