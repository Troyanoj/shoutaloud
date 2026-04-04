import React, { useState, useCallback, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useDID } from '../../hooks/useDID';
import { ipfsService } from '../../services/ipfs';
import { cryptoService } from '../../services/crypto';

interface ProposalFormData {
  title: string;
  description: string;
  category: string;
  municipality: string;
  tags: string[];
  expires_days: number;
}

interface ProposalCategory {
  value: string;
  label: string;
  icon: string;
}

interface ProposalFormProps {
  onSuccess?: (proposalId: number) => void;
  onCancel?: () => void;
  initialData?: Partial<ProposalFormData>;
}

const ProposalForm: React.FC<ProposalFormProps> = ({
  onSuccess,
  onCancel,
  initialData
}) => {
  // Hooks existentes
  const { account, signMessage, isConnected } = useWallet();
  const { did, isVerified: isDIDVerified } = useDID();

  // Estado del formulario
  const [formData, setFormData] = useState<ProposalFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    municipality: initialData?.municipality || '',
    tags: initialData?.tags || [],
    expires_days: initialData?.expires_days || 30
  });

  // Estado de la UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<ProposalCategory[]>([]);

  // Cargar categorías disponibles
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/ciudadanas/proposals/categories/list');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  // Validación del formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.title.trim().length < 10) {
      newErrors.title = 'El título debe tener al menos 10 caracteres';
    }

    if (formData.description.trim().length < 50) {
      newErrors.description = 'La descripción debe tener al menos 50 caracteres';
    }

    if (!formData.category) {
      newErrors.category = 'Debe seleccionar una categoría';
    }

    if (formData.municipality.trim().length < 2) {
      newErrors.municipality = 'Debe especificar el municipio';
    }

    if (!isConnected) {
      newErrors.wallet = 'Debe conectar su wallet';
    }

    if (!isDIDVerified || !did) {
      newErrors.did = 'Debe tener un DID verificado';
    }

    // Validar documentos (máximo 10MB cada uno, tipos permitidos)
    const allowedTypes = ['application/pdf', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'text/plain'];
    const maxFileSize = 10 * 1024 * 1024; // 10MB

    for (const file of documents) {
      if (!allowedTypes.includes(file.type)) {
        newErrors.documents = 'Solo se permiten archivos PDF, DOC, DOCX y TXT';
        break;
      }
      if (file.size > maxFileSize) {
        newErrors.documents = 'Los archivos no pueden superar 10MB';
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en inputs
  const handleInputChange = (field: keyof ProposalFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo si existe
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Manejar documentos
  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setDocuments(files);
  };

  // Manejar tags
  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      handleInputChange('tags', [...formData.tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  // Enviar propuesta
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Preparar datos para firma
      const dataToSign = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        municipality: formData.municipality,
        timestamp: new Date().toISOString()
      };

      // 2. Firmar datos con DID
      const signature = await signMessage(JSON.stringify(dataToSign));
      if (!signature) {
        throw new Error('Error al firmar la propuesta');
      }

      // 3. Preparar FormData para envío
      const submitFormData = new FormData();
      
      const proposalData = {
        ...formData,
        creator_did: did,
        creator_address: account,
        signature
      };

      submitFormData.append('proposal_data', JSON.stringify(proposalData));

      // 4. Adjuntar documentos
      documents.forEach((doc, index) => {
        submitFormData.append('documents', doc);
      });

      // 5. Enviar a API
      const response = await fetch('/api/ciudadanas/proposals/create', {
        method: 'POST',
        body: submitFormData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Error al crear la propuesta');
      }

      // 6. Éxito
      if (onSuccess) {
        onSuccess(result.proposal.id);
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        municipality: '',
        tags: [],
        expires_days: 30
      });
      setDocuments([]);

    } catch (error) {
      console.error('Error enviando propuesta:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Error desconocido' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="proposal-form-container">
      <div className="proposal-form-header">
        <h2>📝 Nueva Propuesta Ciudadana</h2>
        <p>Comparte tu idea para mejorar tu municipio de forma descentralizada</p>
      </div>

      <form onSubmit={handleSubmit} className="proposal-form">
        {/* Título */}
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Título de la Propuesta *
          </label>
          <input
            id="title"
            type="text"
            className={`form-input ${errors.title ? 'error' : ''}`}
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Ej: Crear parque público en el centro de la ciudad"
            maxLength={200}
            disabled={isSubmitting}
          />
          {errors.title && <span className="error-message">{errors.title}</span>}
          <small className="character-count">{formData.title.length}/200</small>
        </div>

        {/* Descripción */}
        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Descripción Detallada *
          </label>
          <textarea
            id="description"
            className={`form-textarea ${errors.description ? 'error' : ''}`}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe tu propuesta con detalle: problema a resolver, solución propuesta, beneficios esperados..."
            rows={6}
            disabled={isSubmitting}
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
          <small className="character-count">{formData.description.length} caracteres</small>
        </div>

        {/* Categoría y Municipio */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category" className="form-label">
              Categoría *
            </label>
            <select
              id="category"
              className={`form-select ${errors.category ? 'error' : ''}`}
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Seleccionar categoría...</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
            {errors.category && <span className="error-message">{errors.category}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="municipality" className="form-label">
              Municipio *
            </label>
            <input
              id="municipality"
              type="text"
              className={`form-input ${errors.municipality ? 'error' : ''}`}
              value={formData.municipality}
              onChange={(e) => handleInputChange('municipality', e.target.value)}
              placeholder="Ej: Bogotá, Medellín, Cali..."
              disabled={isSubmitting}
            />
            {errors.municipality && <span className="error-message">{errors.municipality}</span>}
          </div>
        </div>

        {/* Tags */}
        <div className="form-group">
          <label className="form-label">
            Etiquetas (opcional)
            <small>Ayudan a categorizar y encontrar tu propuesta</small>
          </label>
          
          <div className="tags-input-container">
            <div className="tag-input-wrapper">
              <input
                type="text"
                className="tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Escribe una etiqueta y presiona Enter"
                maxLength={20}
                disabled={isSubmitting || formData.tags.length >= 10}
              />
              <button
                type="button"
                className="tag-add-btn"
                onClick={addTag}
                disabled={!tagInput.trim() || formData.tags.length >= 10}
              >
                Agregar
              </button>
            </div>
            
            <div className="tags-list">
              {formData.tags.map((tag, index) => (
                <span key={index} className="tag">
                  #{tag}
                  <button
                    type="button"
                    className="tag-remove"
                    onClick={() => removeTag(tag)}
                    disabled={isSubmitting}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <small>Máximo 10 etiquetas</small>
          </div>
        </div>

        {/* Documentos adjuntos */}
        <div className="form-group">
          <label htmlFor="documents" className="form-label">
            Documentos de Apoyo (opcional)
          </label>
          <input
            id="documents"
            type="file"
            className={`form-file ${errors.documents ? 'error' : ''}`}
            multiple
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleDocumentChange}
            disabled={isSubmitting}
          />
          {errors.documents && <span className="error-message">{errors.documents}</span>}
          
          {documents.length > 0 && (
            <div className="file-list">
              {documents.map((file, index) => (
                <div key={index} className="file-item">
                  <span className="file-name">📄 {file.name}</span>
                  <span className="file-size">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          )}
          <small>Formatos: PDF, DOC, DOCX, TXT. Máximo 10MB por archivo.</small>
        </div>

        {/* Duración */}
        <div className="form-group">
          <label htmlFor="expires_days" className="form-label">
            Tiempo para Validación Comunitaria
          </label>
          <select
            id="expires_days"
            className="form-select"
            value={formData.expires_days}
            onChange={(e) => handleInputChange('expires_days', parseInt(e.target.value))}
            disabled={isSubmitting}
          >
            <option value={15}>15 días</option>
            <option value={30}>30 días (recomendado)</option>
            <option value={60}>60 días</option>
            <option value={90}>90 días</option>
          </select>
          <small>Tiempo que la comunidad tendrá para validar tu propuesta</small>
        </div>

        {/* Estado de conexión */}
        <div className="connection-status">
          <div className={`status-item ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-icon">{isConnected ? '🟢' : '🔴'}</span>
            <span>Wallet: {isConnected ? `Conectado (${account?.slice(0, 6)}...)` : 'Desconectado'}</span>
          </div>
          
          <div className={`status-item ${isDIDVerified ? 'connected' : 'disconnected'}`}>
            <span className="status-icon">{isDIDVerified ? '🟢' : '🔴'}</span>
            <span>DID: {isDIDVerified ? `Verificado (${did?.slice(0, 10)}...)` : 'No verificado'}</span>
          </div>
        </div>

        {/* Errores generales */}
        {(errors.wallet || errors.did || errors.submit) && (
          <div className="error-section">
            {errors.wallet && <div className="error-message">⚠️ {errors.wallet}</div>}
            {errors.did && <div className="error-message">⚠️ {errors.did}</div>}
            {errors.submit && <div className="error-message">❌ {errors.submit}</div>}
          </div>
        )}

        {/* Información IPFS */}
        <div className="ipfs-info">
          <h4>🌐 Almacenamiento Descentralizado</h4>
          <p>
            Tu propuesta será almacenada en IPFS (InterPlanetary File System) garantizando:
          </p>
          <ul>
            <li>✅ Inmutabilidad - No puede ser modificada sin tu firma</li>
            <li>✅ Resistencia a censura - Distribuida globalmente</li>
            <li>✅ Transparencia total - Verificable por cualquier ciudadano</li>
            <li>✅ Disponibilidad permanente - Sin servidores centralizados</li>
          </ul>
        </div>

        {/* Botones de acción */}
        <div className="form-actions">
          {onCancel && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          )}
          
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting || !isConnected || !isDIDVerified}
          >
            {isSubmitting ? (
              <>
                <span className="spinner">⏳</span>
                Creando Propuesta...
              </>
            ) : (
              <>
                <span>🚀</span>
                Crear Propuesta
              </>
            )}
          </button>
        </div>

        {/* Nota legal */}
        <div className="legal-note">
          <small>
            📋 Al crear esta propuesta, confirmas que:
            <br />
            • El contenido es original y veraz
            • No infringe derechos de terceros
            • Cumple con las normas de convivencia ciudadana
            • Aceitas que sea almacenada de forma descentralizada
          </small>
        </div>
      </form>

      <style jsx>{`
        .proposal-form-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .proposal-form-header {
          text-align: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e5e5e5;
        }

        .proposal-form-header h2 {
          color: #2563eb;
          margin-bottom: 0.5rem;
        }

        .proposal-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-label {
          font-weight: 600;
          color: #374151;
          font-size: 0.9rem;
        }

        .form-label small {
          font-weight: normal;
          color: #6b7280;
          display: block;
          margin-top: 0.2rem;
        }

        .form-input,
        .form-textarea,
        .form-select,
        .form-file {
          padding: 0.75rem;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        .form-input:focus,
        .form-textarea:focus,
        .form-select:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-input.error,
        .form-textarea.error,
        .form-select.error,
        .form-file.error {
          border-color: #dc2626;
          background-color: #fef2f2;
        }

        .form-textarea {
          resize: vertical;
          min-height: 120px;
        }

        .character-count {
          color: #6b7280;
          font-size: 0.8rem;
          text-align: right;
        }

        .tags-input-container {
          gap: 0.75rem;
        }

        .tag-input-wrapper {
          display: flex;
          gap: 0.5rem;
        }

        .tag-input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
        }

        .tag-add-btn {
          padding: 0.5rem 1rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .tag-add-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          background: #eff6ff;
          color: #1d4ed8;
          padding: 0.3rem 0.6rem;
          border-radius: 16px;
          font-size: 0.8rem;
          border: 1px solid #bfdbfe;
        }

        .tag-remove {
          background: none;
          border: none;
          color: #1d4ed8;
          cursor: pointer;
          font-size: 1rem;
          line-height: 1;
          padding: 0;
          margin-left: 0.2rem;
        }

        .file-list {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 0.75rem;
          margin-top: 0.5rem;
        }

        .file-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .file-item:last-child {
          border-bottom: none;
        }

        .file-size {
          color: #6b7280;
          font-size: 0.8rem;
        }

        .connection-status {
          background: #f3f4f6;
          padding: 1rem;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .status-item.connected {
          color: #065f46;
        }

        .status-item.disconnected {
          color: #991b1b;
        }

        .error-section {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 1rem;
        }

        .error-message {
          color: #dc2626;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .error-message:last-child {
          margin-bottom: 0;
        }

        .ipfs-info {
          background: #f0f9ff;
          border: 1px solid #0ea5e9;
          border-radius: 8px;
          padding: 1.5rem;
        }

        .ipfs-info h4 {
          color: #0369a1;
          margin-bottom: 0.75rem;
        }

        .ipfs-info ul {
          margin: 0.75rem 0 0 1rem;
          color: #0369a1;
        }

        .ipfs-info li {
          margin-bottom: 0.3rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        .btn-primary,
        .btn-secondary {
          padding: 0.75rem 2rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-primary {
          background: #2563eb;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .legal-note {
          background: #fffbeb;
          border: 1px solid #fbbf24;
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
        }

        .legal-note small {
          color: #92400e;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .proposal-form-container {
            padding: 1rem;
            margin: 1rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .tag-input-wrapper {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default ProposalForm;