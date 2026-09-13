# Design

## Theme

Light, neutros levemente esverdeados. Cena: gestor de operação da Long Life, no notebook sobre a mesa, luz do dia, durante o horário comercial, querendo em segundos saber quem está atendendo e quem saiu no almoço. Superfície clara e calma; cor reservada para estado.

## Color

Estratégia restrita (neutros tingidos + acento ≤10%) com cores de estado funcionais.

- Neutros em OKLCH tingidos para o hue do acento (chroma 0.006–0.012).
- Acento: verde-teal profundo (saúde), `oklch(0.52 0.09 165)`.
- Estado:
  - disponível/ativo: `oklch(0.62 0.15 150)`
  - em pausa: `oklch(0.72 0.14 75)` (âmbar)
  - inativo: neutro `oklch(0.62 0.01 165)`
  - atenção/fora da janela: `oklch(0.55 0.10 250)`
- Nunca `#000`/`#fff`. Sem gradiente em texto.

## Typography

- UI: Inter (400/500/600).
- Números, ordem, tempos e IDs: JetBrains Mono, tabular.
- Corpo limitado a ~70ch; hierarquia por escala + peso (razão ≥1.25).

## Layout

- Sem grade de cards. Duas colunas de unidade + uma faixa de indicadores no topo.
- Lista densa com colunas alinhadas; separadores por linha, não por card.
- Espaçamento com ritmo (faixa compacta, respiro entre unidades).

## Components

- **Status pill**: dot + rótulo (Ativo / Em almoço 42min / Inativo). Nunca só cor.
- **Linha de vendedor**: nome, status, ordem, leads, último lead (há Xmin), janela, ações.
- **Ação inline**: Pausar (motivo + duração) / Retomar, sem modal.
- **Faixa de indicadores**: ativos, em pausa, inativos, próximo da roleta.
- **Barra de distribuição**: leads por vendedor, uma barra por linha.

## Motion

Ease-out (quart/quint). Sem bounce. Transições de estado curtas (120–180ms). Respeitar `prefers-reduced-motion`.
