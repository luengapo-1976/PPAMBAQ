import { Component, input } from '@angular/core';
import { Badge } from '../../../../shared/ui/badge/badge';
import { ESTADO_CONFIG } from '../../../solicitudes/data/estado.config';
import { formatDateShort } from '../../../../shared/utils/format.util';
import { RecentActivityItem } from '../../data/dashboard-metrics.util';

@Component({
  selector: 'app-recent-activity',
  imports: [Badge],
  templateUrl: './recent-activity.html',
  styleUrl: './recent-activity.scss',
})
export class RecentActivity {
  readonly items = input.required<RecentActivityItem[]>();

  protected readonly estadoConfig = ESTADO_CONFIG;
  protected readonly formatDateShort = formatDateShort;
}
