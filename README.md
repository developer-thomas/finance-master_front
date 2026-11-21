# fm_front

Aplicativo Ionic + Angular do Finance Master (Tailwind CSS 3 + SCSS).

## Branches (git flow)

- `main` — estável
- `develop` — integração
- `feature/*` — trabalho em andamento

## Local

```bash
npm ci
npm start
```

App em `http://localhost:8100`.

Sem Firebase configurado, o login usa armazenamento local e envia `Bearer local.<base64>` para a API em Development.
Enquanto `environment.dadosLocais` for `true`, o livro financeiro continua no navegador.
