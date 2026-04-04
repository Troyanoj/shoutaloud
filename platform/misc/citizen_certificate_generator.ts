// platform/frontend-mobile/web/src/utils/certificates/generateCitizenCertificate.ts

import jsPDF from 'jspdf';
import QRCode from 'qrcode';

// Interfaces para los datos del certificado
export interface UserData {
  id: string;
  name?: string;
  did?: string;
  registrationDate: Date;
  location?: {
    city?: string;
    country?: string;
  };
  publicProfile?: boolean;
}

export interface ReputationData {
  level: number;
  score: number;
  title: string;
  badge: string;
  color: string;
}

export interface AchievementData {
  id: string;
  title: string;
  description: string;
  icon: string;
  dateEarned: Date;
  category: string;
}

export interface CertificateStats {
  proposalsCreated: number;
  validationsCompleted: number;
  moderationsPerformed: number;
  communityContributions: number;
}

// Frases motivacionales por nivel de reputación
const MOTIVATIONAL_PHRASES = {
  1: "¡Cada voz cuenta! Gracias por unirte a nuestra comunidad cívica.",
  2: "Tu participación fortalece nuestra democracia digital.",
  3: "Constructor Cívico: Edificando un futuro más participativo.",
  4: "Líder Comunitario: Inspirando el cambio con cada acción.",
  5: "Embajador de la Transparencia: Tu compromiso transforma comunidades.",
};

// Colores del tema
const COLORS = {
  primary: '#2563eb',
  secondary: '#64748b',
  accent: '#f59e0b',
  success: '#10b981',
  text: '#1f2937',
  light: '#f8fafc',
  border: '#e2e8f0'
};

/**
 * Genera un certificado ciudadano en formato PDF
 * @param userData Datos del usuario
 * @param reputation Datos de reputación
 * @param achievements Logros del usuario
 * @param stats Estadísticas de participación
 * @returns Promise<Blob> PDF generado
 */
export async function generateCitizenCertificate(
  userData: UserData,
  reputation: ReputationData,
  achievements: AchievementData[],
  stats: CertificateStats
): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  try {
    // Configuración de la página
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Fondo y borde decorativo
    await addBackgroundAndBorder(pdf, pageWidth, pageHeight);

    // Cabecera con logo y título
    await addHeader(pdf, margin, contentWidth);

    // Información del ciudadano
    let currentY = await addCitizenInfo(pdf, userData, margin, contentWidth, 60);

    // Badge de reputación
    currentY = await addReputationBadge(pdf, reputation, margin, contentWidth, currentY + 15);

    // Estadísticas de participación
    currentY = await addParticipationStats(pdf, stats, margin, contentWidth, currentY + 15);

    // Top 3 logros
    currentY = await addTopAchievements(pdf, achievements.slice(0, 3), margin, contentWidth, currentY + 15);

    // Frase motivacional
    currentY = await addMotivationalPhrase(pdf, reputation.level, margin, contentWidth, currentY + 20);

    // Código QR (si aplica)
    if (userData.publicProfile) {
      currentY = await addQRCode(pdf, userData, margin, contentWidth, currentY + 15);
    }

    // Pie de página
    await addFooter(pdf, pageWidth, pageHeight, margin);

    // Metadatos del PDF
    addPDFMetadata(pdf, userData);

    return pdf.output('blob');
  } catch (error) {
    console.error('Error generando certificado:', error);
    throw new Error('No se pudo generar el certificado. Inténtalo nuevamente.');
  }
}

/**
 * Añade fondo y borde decorativo al PDF
 */
async function addBackgroundAndBorder(pdf: jsPDF, width: number, height: number): Promise<void> {
  // Fondo sutil
  pdf.setFillColor(248, 250, 252); // COLORS.light
  pdf.rect(0, 0, width, height, 'F');

  // Borde decorativo
  pdf.setDrawColor(37, 99, 235); // COLORS.primary
  pdf.setLineWidth(1);
  pdf.rect(10, 10, width - 20, height - 20, 'S');

  // Líneas decorativas en las esquinas
  const cornerSize = 15;
  pdf.setLineWidth(2);
  
  // Esquina superior izquierda
  pdf.line(15, 15, 15 + cornerSize, 15);
  pdf.line(15, 15, 15, 15 + cornerSize);
  
  // Esquina superior derecha
  pdf.line(width - 15 - cornerSize, 15, width - 15, 15);
  pdf.line(width - 15, 15, width - 15, 15 + cornerSize);
  
  // Esquina inferior izquierda
  pdf.line(15, height - 15, 15 + cornerSize, height - 15);
  pdf.line(15, height - 15 - cornerSize, 15, height - 15);
  
  // Esquina inferior derecha
  pdf.line(width - 15 - cornerSize, height - 15, width - 15, height - 15);
  pdf.line(width - 15, height - 15 - cornerSize, width - 15, height - 15);
}

/**
 * Añade cabecera con logo y título
 */
async function addHeader(pdf: jsPDF, margin: number, contentWidth: number): Promise<void> {
  // Título principal
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(37, 99, 235); // COLORS.primary
  
  const title = 'CERTIFICADO DE PARTICIPACIÓN CÍVICA';
  const titleWidth = pdf.getTextWidth(title);
  const titleX = margin + (contentWidth - titleWidth) / 2;
  pdf.text(title, titleX, 35);

  // Subtítulo
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  pdf.setTextColor(100, 116, 139); // COLORS.secondary
  
  const subtitle = 'Shout Aloud Platform - Democracia Digital Transparente';
  const subtitleWidth = pdf.getTextWidth(subtitle);
  const subtitleX = margin + (contentWidth - subtitleWidth) / 2;
  pdf.text(subtitle, subtitleX, 45);

  // Línea separadora
  pdf.setDrawColor(226, 232, 240); // COLORS.border
  pdf.setLineWidth(0.5);
  pdf.line(margin + 20, 50, margin + contentWidth - 20, 50);
}

/**
 * Añade información del ciudadano
 */
async function addCitizenInfo(
  pdf: jsPDF, 
  userData: UserData, 
  margin: number, 
  contentWidth: number, 
  startY: number
): Promise<number> {
  let currentY = startY;

  // Título de sección
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(31, 41, 55); // COLORS.text
  pdf.text('CIUDADANO CERTIFICADO', margin, currentY);
  currentY += 10;

  // Nombre o DID
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  const displayName = userData.name || `DID: ${userData.did?.substring(0, 20)}...`;
  pdf.text(`Nombre/Identificador: ${displayName}`, margin + 5, currentY);
  currentY += 7;

  // Fecha de registro
  const registrationDate = userData.registrationDate.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  pdf.text(`Miembro desde: ${registrationDate}`, margin + 5, currentY);
  currentY += 7;

  // Ubicación (si está disponible)
  if (userData.location?.city && userData.location?.country) {
    pdf.text(`Ubicación: ${userData.location.city}, ${userData.location.country}`, margin + 5, currentY);
    currentY += 7;
  }

  return currentY;
}

/**
 * Añade badge de reputación
 */
async function addReputationBadge(
  pdf: jsPDF,
  reputation: ReputationData,
  margin: number,
  contentWidth: number,
  startY: number
): Promise<number> {
  let currentY = startY;

  // Título de sección
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(31, 41, 55);
  pdf.text('NIVEL DE REPUTACIÓN', margin, currentY);
  currentY += 15;

  // Badge circular de fondo
  const badgeX = margin + contentWidth / 2;
  const badgeY = currentY + 15;
  const badgeRadius = 20;

  // Convertir color hex a RGB
  const rgb = hexToRgb(reputation.color);
  pdf.setFillColor(rgb.r, rgb.g, rgb.b);
  pdf.circle(badgeX, badgeY, badgeRadius, 'F');

  // Nivel en el centro del badge
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(255, 255, 255);
  const levelText = `${reputation.level}`;
  const levelWidth = pdf.getTextWidth(levelText);
  pdf.text(levelText, badgeX - levelWidth / 2, badgeY + 3);

  // Título de reputación
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(rgb.r, rgb.g, rgb.b);
  const titleWidth = pdf.getTextWidth(reputation.title);
  pdf.text(reputation.title, badgeX - titleWidth / 2, badgeY + 35);

  // Puntuación
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  const scoreText = `${reputation.score} puntos de reputación`;
  const scoreWidth = pdf.getTextWidth(scoreText);
  pdf.text(scoreText, badgeX - scoreWidth / 2, badgeY + 45);

  return currentY + 70;
}

/**
 * Añade estadísticas de participación
 */
async function addParticipationStats(
  pdf: jsPDF,
  stats: CertificateStats,
  margin: number,
  contentWidth: number,
  startY: number
): Promise<number> {
  let currentY = startY;

  // Título de sección
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(31, 41, 55);
  pdf.text('CONTRIBUCIONES A LA COMUNIDAD', margin, currentY);
  currentY += 15;

  // Configurar columnas
  const columnWidth = contentWidth / 2;
  const leftColumn = margin + 5;
  const rightColumn = margin + columnWidth + 10;

  // Estadísticas de la izquierda
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(31, 41, 55);

  pdf.text(`📝 Propuestas creadas: ${stats.proposalsCreated}`, leftColumn, currentY);
  pdf.text(`✅ Validaciones realizadas: ${stats.validationsCompleted}`, leftColumn, currentY + 8);

  // Estadísticas de la derecha
  pdf.text(`⚖️ Moderaciones: ${stats.moderationsPerformed}`, rightColumn, currentY);
  pdf.text(`🤝 Contribuciones totales: ${stats.communityContributions}`, rightColumn, currentY + 8);

  return currentY + 20;
}

/**
 * Añade top 3 logros
 */
async function addTopAchievements(
  pdf: jsPDF,
  achievements: AchievementData[],
  margin: number,
  contentWidth: number,
  startY: number
): Promise<number> {
  if (achievements.length === 0) return startY;

  let currentY = startY;

  // Título de sección
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(31, 41, 55);
  pdf.text('LOGROS DESTACADOS', margin, currentY);
  currentY += 15;

  // Mostrar cada logro
  achievements.forEach((achievement, index) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(245, 158, 11); // COLORS.accent
    pdf.text(`${achievement.icon} ${achievement.title}`, margin + 5, currentY);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    
    // Descripción con wrap de texto
    const description = achievement.description.length > 60 
      ? achievement.description.substring(0, 57) + '...'
      : achievement.description;
    pdf.text(description, margin + 8, currentY + 6);
    
    currentY += 18;
  });

  return currentY;
}

/**
 * Añade frase motivacional
 */
async function addMotivationalPhrase(
  pdf: jsPDF,
  reputationLevel: number,
  margin: number,
  contentWidth: number,
  startY: number
): Promise<number> {
  const phrase = MOTIVATIONAL_PHRASES[reputationLevel as keyof typeof MOTIVATIONAL_PHRASES] 
    || MOTIVATIONAL_PHRASES[1];

  // Caja decorativa para la frase
  pdf.setFillColor(37, 99, 235, 0.1); // COLORS.primary con transparencia
  pdf.setDrawColor(37, 99, 235);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(margin, startY - 5, contentWidth, 20, 3, 3, 'FD');

  // Frase motivacional
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(12);
  pdf.setTextColor(37, 99, 235);
  
  const phraseLines = pdf.splitTextToSize(phrase, contentWidth - 10);
  pdf.text(phraseLines, margin + 5, startY + 5);

  return startY + Math.max(20, phraseLines.length * 6);
}

/**
 * Añade código QR para verificación
 */
async function addQRCode(
  pdf: jsPDF,
  userData: UserData,
  margin: number,
  contentWidth: number,
  startY: number
): Promise<number> {
  try {
    // URL de verificación (esto sería la URL real de tu plataforma)
    const verificationUrl = `https://shout-aloud.platform/verify/${userData.id}`;
    
    // Generar QR como imagen base64
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 100,
      margin: 1,
      color: {
        dark: '#1f2937',
        light: '#ffffff'
      }
    });

    // Título
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(31, 41, 55);
    pdf.text('VERIFICACIÓN DIGITAL', margin, startY);

    // Añadir QR code
    const qrSize = 25;
    const qrX = margin + contentWidth - qrSize - 5;
    pdf.addImage(qrCodeDataUrl, 'PNG', qrX, startY + 5, qrSize, qrSize);

    // Texto explicativo
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    const explanationText = 'Escanea para verificar\nla autenticidad de este\ncertificado en línea.';
    pdf.text(explanationText, margin + 5, startY + 15);

    return startY + 35;
  } catch (error) {
    console.warn('No se pudo generar el código QR:', error);
    return startY;
  }
}

/**
 * Añade pie de página
 */
async function addFooter(
  pdf: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number
): Promise<void> {
  const footerY = pageHeight - 25;

  // Línea separadora
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.5);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  // Disclaimer ético
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  
  const disclaimer = 'Este certificado refleja la participación voluntaria en nuestra plataforma de democracia digital.';
  const disclaimerWidth = pdf.getTextWidth(disclaimer);
  const disclaimerX = (pageWidth - disclaimerWidth) / 2;
  pdf.text(disclaimer, disclaimerX, footerY);

  // Información adicional
  const info = 'Para más información, visita: https://shout-aloud.platform';
  const infoWidth = pdf.getTextWidth(info);
  const infoX = (pageWidth - infoWidth) / 2;
  pdf.text(info, infoX, footerY + 6);

  // Fecha de generación
  const currentDate = new Date().toLocaleDateString('es-ES');
  const dateText = `Generado el: ${currentDate}`;
  const dateWidth = pdf.getTextWidth(dateText);
  pdf.text(dateText, pageWidth - margin - dateWidth, footerY + 12);
}

/**
 * Añade metadatos al PDF
 */
function addPDFMetadata(pdf: jsPDF, userData: UserData): void {
  const displayName = userData.name || userData.did?.substring(0, 20) || 'Ciudadano';
  
  pdf.setProperties({
    title: `Certificado de Participación Cívica - ${displayName}`,
    subject: 'Certificado de participación en plataforma de democracia digital',
    author: 'Shout Aloud Platform',
    creator: 'Generador de Certificados Ciudadanos',
    keywords: 'democracia digital, participación cívica, certificado, transparencia'
  });
}

/**
 * Convierte color hexadecimal a RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 37, g: 99, b: 235 }; // Color por defecto
}

/**
 * Función de utilidad para descargar el certificado
 */
export async function downloadCertificate(
  userData: UserData,
  reputation: ReputationData,
  achievements: AchievementData[],
  stats: CertificateStats,
  filename?: string
): Promise<void> {
  try {
    const pdfBlob = await generateCitizenCertificate(userData, reputation, achievements, stats);
    
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    
    const displayName = userData.name || 'ciudadano';
    const defaultFilename = `certificado-civico-${displayName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
    link.download = filename || defaultFilename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error descargando certificado:', error);
    throw error;
  }
}

/**
 * Función para obtener vista previa del certificado como imagen
 */
export async function getCertificatePreview(
  userData: UserData,
  reputation: ReputationData,
  achievements: AchievementData[],
  stats: CertificateStats
): Promise<string> {
  try {
    const pdfBlob = await generateCitizenCertificate(userData, reputation, achievements, stats);
    
    // Convertir PDF a imagen para vista previa (requiere pdf-lib adicional)
    // Por ahora retornamos el blob URL
    return URL.createObjectURL(pdfBlob);
  } catch (error) {
    console.error('Error generando vista previa:', error);
    throw error;
  }
}