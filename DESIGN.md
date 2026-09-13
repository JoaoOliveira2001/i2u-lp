# Design

## Theme

Dark, alinhado ao portal do cliente Long Life. Cena: gestor de operação da Long Life, no notebook, acompanhando a fila girando em tempo real; superfície escura para leitura prolongada e verde neon reservado para estado e ação.

## Color

Paleta idêntica ao `/cliente/longlife` (tokens em `src/cliente/styles.css`):

- `--bg #050507`, `--bg-soft #0a0a0e`, `--surface #101015`, `--surface-2 #16161d`
- `--line rgba(255,255,255,.08)`, `--line-strong rgba(255,255,255,.16)`
- `--text #f4f4f6`, `--muted #9b9ba6`, `--faint #5c5c66`
- `--accent #00ff88`, `--accent-dim rgba(0,255,136,.12)`, `--accent-glow rgba(0,255,136,.35)`
- `--warn #ffb347`, `--danger #ff5c7a`
- Fundo com glow radial sutil (verde) como no portal. Sem gradiente em texto.

## Typography

- Display/títulos: Space Grotesk (500/600/700).
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
