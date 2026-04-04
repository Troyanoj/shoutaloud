// platform/frontend-mobile/web/src/utils/AchievementsList.ts

export interface AchievementTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'participation' | 'moderation' | 'impact' | 'community';
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum';
  motivationalMessage: string;
  tips: string[];
}

export const ACHIEVEMENT_TEMPLATES: AchievementTemplate[] = [
  // PARTICIPACIÓN - Bronce
  {
    id: 'first-step',
    name: 'Primer Paso',
    icon: '🧩',
    description: 'Has creado tu primera propuesta ciudadana.',
    category: 'participation',
    difficulty: 'bronze',
    motivationalMessage: '¡Bienvenido a la democracia participativa! Cada gran cambio comienza con una primera acción.',
    tips: [
      'Piensa en un problema que te afecte directamente',
      'Propón soluciones constructivas y específicas',
      'Usa un lenguaje claro y respetuoso'
    ]
  },
  {
    id: 'active-voice',
    name: 'Voz Activa',
    icon: '🗳️',
    description: 'Has participado en 5 votaciones.',
    category: 'participation',
    difficulty: 'bronze',
    motivationalMessage: 'Tu opinión cuenta en la construcción de consensos. Cada voto es una semilla de cambio.',
    tips: [
      'Lee cada propuesta con detenimiento',
      'Considera diferentes perspectivas antes de votar',
      'Tu voto ayuda a dar forma al futuro compartido'
    ]
  },

  // PARTICIPACIÓN - Plata
  {
    id: 'engaged-citizen',
    name: 'Ciudadano Comprometido',
    icon: '🔥',
    description: 'Has participado en 10 votaciones.',
    category: 'participation',
    difficulty: 'silver',
    motivationalMessage: 'Demuestras un compromiso constante con la democracia. Eres ejemplo de participación.',
    tips: [
      'Comparte tus reflexiones con otros ciudadanos',
      'Invita a familiares y amigos a participar',
      'Considera crear propuestas sobre temas que conoces bien'
    ]
  },

  // MODERACIÓN - Bronce
  {
    id: 'initial-moderator',
    name: 'Moderador Inicial',
    icon: '🤝',
    description: 'Has validado o reportado 3 propuestas.',
    category: 'moderation',
    difficulty: 'bronze',
    motivationalMessage: 'Ayudas a mantener la calidad del diálogo ciudadano. Tu criterio fortalece la comunidad.',
    tips: [
      'Enfócate en el contenido, no en las personas',
      'Usa los criterios de moderación como guía',
      'Cada validación mejora la experiencia de todos'
    ]
  },

  // MODERACIÓN - Plata
  {
    id: 'system-defender',
    name: 'Defensor del Sistema',
    icon: '🛡️',
    description: 'Has reportado exitosamente 5 propuestas problemáticas.',
    category: 'moderation',
    difficulty: 'silver',
    motivationalMessage: 'Proteges la integridad del espacio democrático. Eres guardián de los valores comunitarios.',
    tips: [
      'Reporta solo cuando algo realmente va contra las normas',
      'Explica claramente el motivo del reporte',
      'Ayuda a mantener un ambiente constructivo'
    ]
  },

  // MODERACIÓN - Oro
  {
    id: 'community-guardian',
    name: 'Guardián Comunitario',
    icon: '🌟',
    description: 'Has realizado 15 moderaciones exitosas.',
    category: 'moderation',
    difficulty: 'gold',
    motivationalMessage: 'Eres un pilar de la comunidad. Tu dedicación construye espacios más justos para todos.',
    tips: [
      'Considera ser mentor de nuevos moderadores',
      'Comparte tu experiencia en los foros comunitarios',
      'Tu ejemplo inspira a otros a cuidar el espacio común'
    ]
  },

  // IMPACTO - Bronce
  {
    id: 'symbolic-constituent',
    name: 'Constituyente Simbólico',
    icon: '📜',
    description: 'Has validado 1 propuesta con alto impacto.',
    category: 'impact',
    difficulty: 'bronze',
    motivationalMessage: 'Contribuyes a decisiones importantes. Tu criterio ayuda a identificar propuestas transformadoras.',
    tips: [
      'Evalúa el potencial impacto real de cada propuesta',
      'Considera las consecuencias a largo plazo',
      'Tu validación puede cambiar vidas'
    ]
  },

  // IMPACTO - Plata
  {
    id: 'change-catalyst',
    name: 'Catalizador de Cambio',
    icon: '⚡',
    description: 'Has validado 3 propuestas de alto impacto.',
    category: 'impact',
    difficulty: 'silver',
    motivationalMessage: 'Impulsas transformaciones significativas. Tienes un ojo especial para identificar el cambio positivo.',
    tips: [
      'Busca propuestas que aborden problemas sistémicos',
      'Apoya iniciativas innovadoras y viables',
      'Tu criterio se está refinando con la experiencia'
    ]
  },

  // IMPACTO - Oro
  {
    id: 'trusted-citizen',
    name: 'Ciudadano de Confianza',
    icon: '💎',
    description: 'Has alcanzado 500 puntos de reputación.',
    category: 'impact',
    difficulty: 'gold',
    motivationalMessage: 'La comunidad confía en tu criterio. Eres referencia de participación ciudadana responsable.',
    tips: [
      'Usa tu influencia para guiar conversaciones constructivas',
      'Apoya a ciudadanos que están comenzando su participación',
      'Tu reputación es un patrimonio comunitario'
    ]
  },

  // COMUNIDAD - Bronce
  {
    id: 'helpful-neighbor',
    name: 'Vecino Solidario',
    icon: '🤲',
    description: 'Has ayudado a otros ciudadanos 5 veces.',
    category: 'community',
    difficulty: 'bronze',
    motivationalMessage: 'Fortaleces los lazos comunitarios. Tu solidaridad hace la diferencia en la vida de otros.',
    tips: [
      'Responde preguntas de nuevos usuarios',
      'Comparte recursos útiles',
      'Celebra los logros de otros ciudadanos'
    ]
  },

  // COMUNIDAD - Plata
  {
    id: 'consistent-participant',
    name: 'Participante Constante',
    icon: '📅',
    description: 'Has estado activo por 30 días.',
    category: 'community',
    difficulty: 'silver',
    motivationalMessage: 'Demuestras compromiso a largo plazo. Tu constancia es ejemplo de ciudadanía responsable.',
    tips: [
      'Mantén rutinas saludables de participación',
      'Equilibra la participación con tu bienestar personal',
      'Tu presencia constante da estabilidad a la comunidad'
    ]
  }
];

export const CATEGORY_INFO = {
  participation: {
    name: 'Participación',
    icon: '🗳️',
    description: 'Logros relacionados con la participación activa en votaciones y creación de propuestas',
    color: '#3B82F6'
  },
  moderation: {
    name: 'Moderación',
    icon: '🤝',
    description: 'Logros por contribuir a mantener la calidad y el respeto en la comunidad',
    color: '#10B981'
  },
  impact: {
    name: 'Impacto',
    icon: '⚡',
    description: 'Logros por identificar y apoyar propuestas de alto valor e impacto social',
    color: '#F59E0B'
  },
  community: {
    name: 'Comunidad',
    icon: '🌟',
    description: 'Logros por construir y fortalecer los lazos comunitarios',
    color: '#8B5CF6'
  }
};

export const DIFFICULTY_INFO = {
  bronze: {
    name: 'Bronce',
    color: '#CD7F32',
    description: 'Primeros pasos en la participación ciudadana'
  },
  silver: {
    name: 'Plata',
    color: '#C0C0C0',
    description: 'Participación activa y comprometida'
  },
  gold: {
    name: 'Oro',
    color: '#FFD700',
    description: 'Liderazgo y impacto significativo en la comunidad'
  },
  platinum: {
    name: 'Platino',
    color: '#E5E4E2',
    description: 'Excelencia excepcional en la construcción democrática'
  }
};