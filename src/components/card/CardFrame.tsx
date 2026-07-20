type CardFrameProps = {
  accent: string;
  accentSoft: string;
};

/**
 * Moldura única em SVG, em coordenadas fixas (viewBox 864x1234) medidas a
 * partir do template de margens enviado por Davi. A "identidade visual" de
 * cada tipo de carta entra só via `accent`/`accentSoft` — o desenho da
 * moldura em si (linhas, caixas, chanfros) é o mesmo para todos os tipos.
 *
 * Cores fixas do desenho (cinzas/pretos) ficam hardcoded aqui de propósito:
 * são a "base neutra" da moldura, igual nos dois exemplos de referência.
 */
export function CardFrame({ accent, accentSoft }: CardFrameProps) {
  const ink = "#3a3d42"; // cor das linhas finas da moldura
  const panel = "#d9dadc"; // cinza claro de preenchimento dos painéis
  const panelDark = "#cfd0d2";
  const iconBoxFill = "#16181b"; // preto das caixas de ícone

  return (
    <svg
      viewBox="0 0 864 1234"
      className="absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/*
        NÃO colocar rect fill cobrindo o card inteiro aqui.
        O fundo geral vem do CSS do CardCanvas (inner div background).
        Qualquer fill sólido do SVG na área da arte (x:154-829, y:166-852)
        fica na frente da <img> e esconde a imagem — o SVG vem depois
        no DOM então tem z-index implícito maior.
      */}

      {/* coluna esquerda - fundo */}
      <rect x={28} y={34} width={122} height={819} fill={panelDark} />
      {/* cabeçalho - fundo */}
      <rect x={154} y={34} width={675} height={131} fill={panelDark} />
      {/* área da arte: sem fill — a <img> abaixo mostra aqui */}
      {/* caixa de habilidade - fundo */}
      <rect x={36} y={853} width={793} height={199} fill={panelDark} />
      {/* rodapé - fundo */}
      <rect x={36} y={1052} width={793} height={103} fill={panelDark} />
      {/* faixa inferior - fundo */}
      <rect x={36} y={1155} width={793} height={44} fill={panelDark} />

      {/* ===== contorno externo (borda dupla com chanfro no canto sup. direito) ===== */}
      <path
        d="M 34 8 H 798 L 856 8 V 30 L 798 66 H 34 a 26 26 0 0 1 -26 -26 V 34 a 26 26 0 0 1 26 -26 Z"
        fill="none"
        stroke={ink}
        strokeWidth={2}
        opacity={0}
      />
      <rect
        x={8}
        y={8}
        width={848}
        height={1218}
        rx={26}
        fill="none"
        stroke={ink}
        strokeWidth={3}
      />
      <path
        d="M16 16 H 790 L 832 16"
        fill="none"
        stroke={ink}
        strokeWidth={1.5}
        opacity={0.5}
      />

      {/* ===== coluna esquerda: 5 caixas ===== */}
      <rect x={36} y={34} width={114} height={171} rx={10} fill="none" stroke={ink} strokeWidth={2.5} />
      <rect x={36} y={208} width={114} height={157} rx={10} fill="none" stroke={ink} strokeWidth={2.5} />
      <rect x={36} y={369} width={114} height={157} rx={10} fill="none" stroke={ink} strokeWidth={2.5} />
      <rect x={36} y={529} width={114} height={156} rx={10} fill="none" stroke={ink} strokeWidth={2.5} />
      <rect x={36} y={689} width={114} height={164} rx={10} fill="none" stroke={ink} strokeWidth={2.5} />

      {/* caixa 1 (custo) e caixa 2 (categoria) com fundo preto, como nos exemplos */}
      <rect x={36} y={34} width={114} height={171} rx={10} fill={iconBoxFill} />
      <rect x={36} y={208} width={114} height={157} rx={10} fill={iconBoxFill} />

      {/* ===== cabeçalho: nome + subtítulo ===== */}
      <rect
        x={154}
        y={34}
        width={675}
        height={86}
        rx={14}
        fill="none"
        stroke={ink}
        strokeWidth={2.5}
      />
      <path
        d="M154 121 H 829 M540 121 L 565 143 L 700 143 L 712 132 H 829"
        fill="none"
        stroke={ink}
        strokeWidth={2}
      />
      <rect
        x={154}
        y={121}
        width={675}
        height={44}
        rx={10}
        fill="none"
        stroke={ink}
        strokeWidth={2}
      />
      {/* marcas decorativas no canto direito do subtítulo */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1={770 + i * 11}
          y1={132}
          x2={762 + i * 11}
          y2={154}
          stroke={ink}
          strokeWidth={2.5}
          opacity={0.6}
        />
      ))}

      {/* ===== caixa de arte ===== */}
      <rect
        x={154}
        y={166}
        width={675}
        height={686}
        fill="none"
        stroke={ink}
        strokeWidth={2.5}
      />

      {/* ===== caixa de habilidade (categoria + ícone + texto) ===== */}
      <path
        d="M36 894 H 360 L 384 853 H 829"
        fill="none"
        stroke={ink}
        strokeWidth={2}
        opacity={0.7}
      />
      <rect
        x={36}
        y={853}
        width={793}
        height={199}
        rx={14}
        fill="none"
        stroke={ink}
        strokeWidth={2.5}
      />
      {/* caixa do ícone de habilidade */}
      <rect x={56} y={905} width={130} height={130} rx={14} fill={iconBoxFill} />

      {/* ===== rodapé: flavor text | emblema ===== */}
      <rect
        x={36}
        y={1052}
        width={793}
        height={103}
        fill="none"
        stroke={ink}
        strokeWidth={2.5}
      />
      <line x1={567} y1={1052} x2={567} y2={1155} stroke={ink} strokeWidth={2} />
      {/* círculo do emblema, colorido pelo tipo da carta */}
      <circle cx={698} cy={1103} r={38} fill={accentSoft} stroke={accent} strokeWidth={3} />

      {/* ===== faixa inferior: aba colorida + rótulo de expansão + marcas ===== */}
      <path
        d="M36 1186 V 1168 a 13 13 0 0 1 13 -13 H 67 V 1199 H 36 Z"
        fill="none"
        stroke={ink}
        strokeWidth={2}
        opacity={0.6}
      />
      <rect x={36} y={1175} width={31} height={24} fill={accent} />
      <line x1={36} y1={1155} x2={829} y2={1155} stroke={ink} strokeWidth={2} />
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1={760 + i * 11}
          y1={1166}
          x2={752 + i * 11}
          y2={1188}
          stroke={ink}
          strokeWidth={2.5}
          opacity={0.6}
        />
      ))}
    </svg>
  );
}
