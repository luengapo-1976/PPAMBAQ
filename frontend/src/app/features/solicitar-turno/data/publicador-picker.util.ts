import { SearchSelectOption } from '../../../shared/ui/search-select/search-select';
import { Publicador } from '../../solicitudes/data/models';
import { nombreCompleto } from '../../solicitudes/data/publicador.utils';

/** Opciones para elegir un publicador buscando por nombre o móvil: el móvil
 * queda dentro del label, así que el filtro por substring de app-search-select
 * matchea igual con cualquiera de los dos. */
export function publicadorSearchOptions(publicadores: Publicador[]): SearchSelectOption[] {
  return [...publicadores]
    .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es'))
    .map((publicador) => ({
      value: publicador.id,
      label: `${nombreCompleto(publicador)} - ${publicador.movil || 'sin móvil'}`,
    }));
}
