# Megamania 2.0 — Space Shooter

🎮 **Jogue agora pelo navegador:** [https://p5-mega-mania.vercel.app/](https://p5-mega-mania.vercel.app/)

Um clássico jogo arcade estilo Atari recriado do zero em **Vanilla JavaScript** (ES6+), HTML5 Canvas e Web Audio API. Inspirado no jogo Megamania do Atari 2600.

## 🚀 Funcionalidades

### 🎮 Mecânicas Principais
- Controle de nave com movimento fluido (A/D ou Setas).
- Disparo rápido (Barra de Espaço) com tempo de recarga estratégico.
- Sistema de energia de combustível que esgota com o tempo; destruir toda a onda de inimigos restaura 100%.
- Sistema de vida (3 vidas por padrão).

### 🛡️ Novidades na Versão 2.0
- **Power-ups**: Spread Shot (tiro triplo em leque) e Shield (absorve 1 hit).
- **Inimigos Avançados**: Inimigos kamikaze que mergulham no jogador após o nível 3.
- **Boss Fight**: Chefão especial no final de cada 5 níveis com barra de vida e padrões de tiro.
- **Efeitos de Juice**: Screen shake ao ser atingido e partículas realistas de explosão e motor.
- **Persistência**: Recorde mantido no `localStorage`.
- **Efeitos Sonoros**: Sons sintetizados nativamente via Web Audio API.

## 🛠️ Instalação e Execução

Para rodar localmente, basta ter o Node.js instalado ou qualquer servidor estático:

```bash
# Clone o repositório
git clone https://github.com/abneraprigio/p5MegaMania.git

# Acesse a pasta
cd p5MegaMania

# Inicialize o servidor local (opcional)
npm start
```

Ou simplesmente abra o arquivo `index.html` em seu navegador.

## 📄 Licença
Este projeto está sob a licença MIT.
