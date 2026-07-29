import { COLORS } from './theme';

let jaConfigurado = false;

// Estiliza a barra de rolagem nativa do navegador pro tema do Vira (fina, discreta)
// e só mostra a "trilha" colorida enquanto a página está sendo rolada, sumindo depois.
export function configurarScrollbarWeb() {
  if (jaConfigurado || typeof document === 'undefined') return;
  jaConfigurado = true;

  const style = document.createElement('style');
  style.textContent = `
    * {
      scrollbar-width: thin;
      scrollbar-color: transparent transparent;
    }
    *::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    *::-webkit-scrollbar-track {
      background: transparent;
    }
    *::-webkit-scrollbar-thumb {
      background: transparent;
      border-radius: 999px;
    }
    html.vira-rolando {
      scrollbar-color: ${COLORS.border} transparent;
    }
    html.vira-rolando *::-webkit-scrollbar-thumb {
      background: ${COLORS.border};
    }
  `;
  document.head.appendChild(style);

  let timeout;
  window.addEventListener(
    'scroll',
    () => {
      document.documentElement.classList.add('vira-rolando');
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        document.documentElement.classList.remove('vira-rolando');
      }, 700);
    },
    true
  );
}
