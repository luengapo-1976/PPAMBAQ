import { BadgeTone } from '../../../shared/ui/badge/badge';
import { EstadoSolicitud } from './models';

export const ESTADO_CONFIG: Record<EstadoSolicitud, { icon: string; tone: BadgeTone; label: string }> = {
  REGISTRADO: { icon: 'how_to_reg', tone: 'info', label: 'Registrado' },
  'NOTIFICADO PRIMER ENTRENAMIENTO': {
    icon: 'campaign',
    tone: 'warning',
    label: 'Notificado 1er entrenamiento',
  },
  'NOTIFICADO SEGUNDO ENTRENAMIENTO': {
    icon: 'campaign',
    tone: 'warning',
    label: 'Notificado 2do entrenamiento',
  },
  'CUMPLE REQUISITOS': { icon: 'verified', tone: 'success', label: 'Cumple requisitos' },
};
